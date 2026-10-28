import type { Stack, StackState } from "./types.ts";

export type Board = Stack[];

export function stackKey(s: StackState): string {
  return [
    s.tokenId,
    s.power,
    s.toughness,
    s.counters,
    s.tapped ? "T" : "U",
    s.sick ? "S" : "R",
  ].join("|");
}

export function normalize(board: Board): Board {
  const merged = new Map<string, Stack>();
  for (const stack of board) {
    if (stack.count <= 0) continue;
    const key = stackKey(stack);
    const existing = merged.get(key);
    if (existing) existing.count += stack.count;
    else merged.set(key, { ...stack });
  }
  return [...merged.values()];
}

export function addToken(
  board: Board,
  state: Omit<StackState, "tapped" | "sick">,
): Board {
  return normalize([
    ...board,
    {
      ...state,
      counters: Math.max(0, state.counters),
      tapped: false,
      sick: true,
      count: 1,
    },
  ]);
}

export function addCountersToAll(board: Board, amount: number): Board {
  return normalize(board.map((s) => ({ ...s, counters: s.counters + amount })));
}

export function proliferate(board: Board, amount: number): Board {
  return normalize(
    board.map((s) =>
      s.counters > 0 ? { ...s, counters: s.counters + amount } : s,
    ),
  );
}

export function startTurn(board: Board): Board {
  return normalize(board.map((s) => ({ ...s, tapped: false, sick: false })));
}

export function updateFromStack(
  board: Board,
  key: string,
  n: number,
  update: (s: StackState) => StackState,
): Board {
  const next: Board = [];
  for (const stack of board) {
    if (stackKey(stack) !== key) {
      next.push(stack);
      continue;
    }
    const moved = Math.min(n, stack.count);
    next.push({ ...stack, count: stack.count - moved });
    next.push({ ...update(stack), count: moved });
  }
  return normalize(next);
}

export function setTapped(
  board: Board,
  key: string,
  n: number,
  tapped: boolean,
): Board {
  return updateFromStack(board, key, n, (s) => ({ ...s, tapped }));
}

export function compareStacks(a: Stack, b: Stack): number {
  return (
    b.power + b.counters - (a.power + a.counters) ||
    b.toughness + b.counters - (a.toughness + a.counters) ||
    Number(a.tapped) - Number(b.tapped) ||
    Number(a.sick) - Number(b.sick)
  );
}

export function canAttack(s: StackState): boolean {
  return !s.tapped && !s.sick;
}

export function stackPower(s: StackState, bonus = 0): number {
  return s.power + s.counters + bonus;
}

export function stackToughness(s: StackState, bonus = 0): number {
  return s.toughness + s.counters + bonus;
}

export function attackPower(s: StackState, bonus = 0): number {
  return Math.max(0, stackPower(s, bonus));
}

export function tapAttackers(
  board: Board,
  attackers: Record<string, number>,
): Board {
  return Object.entries(attackers).reduce(
    (b, [key, n]) => setTapped(b, key, n, true),
    board,
  );
}

export function resolveCombat(
  board: Board,
  attackers: Record<string, number>,
  dead: Record<string, number>,
): Board {
  const survivors = Object.entries(dead).reduce(
    (b, [key, n]) => (n > 0 ? removeFromStack(b, key, n) : b),
    board,
  );
  return tapAttackers(
    survivors,
    Object.fromEntries(
      Object.entries(attackers).map(([key, n]) => [key, n - (dead[key] ?? 0)]),
    ),
  );
}

export function addCountersToStack(
  board: Board,
  key: string,
  n: number,
  amount: number,
): Board {
  return updateFromStack(board, key, n, (s) => ({
    ...s,
    counters: Math.max(0, s.counters + amount),
  }));
}

export function removeFromStack(board: Board, key: string, n: number): Board {
  return normalize(
    board.map((s) => (stackKey(s) === key ? { ...s, count: s.count - n } : s)),
  );
}

export function totalCount(board: Board): number {
  return board.reduce((sum, s) => sum + s.count, 0);
}
