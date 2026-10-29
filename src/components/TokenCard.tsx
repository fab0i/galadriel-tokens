import {
  compareStacks,
  stackKey,
  stackPower,
  stackToughness,
} from "../board.ts";
import { useLongPress } from "../hooks.ts";
import { useStore } from "../store.ts";
import type { Stack, TokenDef } from "../types.ts";
import { formatCounters } from "./CounterStepper.tsx";
import { TokenArt } from "./TokenArt.tsx";

interface Props {
  token: TokenDef;
  stacks: Stack[];
  onOpenStack: (stack: Stack) => void;
  onCustomEnter: (token: TokenDef) => void;
  onOpenBonus: (token: TokenDef) => void;
}

export function TokenCard({
  token,
  stacks,
  onOpenStack,
  onCustomEnter,
  onOpenBonus,
}: Props) {
  const createToken = useStore((s) => s.createToken);
  const bonus = useStore((s) => s.modifiers.typeBonuses[token.id] ?? 0);
  const addPress = useLongPress(
    () => createToken(token),
    () => onCustomEnter(token),
  );
  const total = stacks.reduce((sum, s) => sum + s.count, 0);

  return (
    <article className="token-card">
      <header className="token-card-header">
        <TokenArt token={token} />
        <button
          className="token-card-title"
          aria-label={`Bonus for all ${token.name} tokens`}
          onClick={() => onOpenBonus(token)}
        >
          <h3>{token.name}</h3>
          <span>
            {token.power}/{token.toughness}
            {bonus !== 0 && ` ${formatCounters(bonus)}`} · {total} on board
          </span>
        </button>
        <button
          className="add-one"
          aria-label={`Create another ${token.name}`}
          {...addPress}
        >
          +1
        </button>
      </header>
      <ul className="stack-rows">
        {[...stacks].sort(compareStacks).map((stack) => (
          <li key={stackKey(stack)}>
            <button
              className={`stack-row ${stack.tapped ? "tapped" : ""}`}
              onClick={() => onOpenStack(stack)}
            >
              <span className="stack-count">×{stack.count}</span>
              <span className="stack-pt">
                {stackPower(stack, bonus)}
                <i>/</i>
                {stackToughness(stack, bonus)}
              </span>
              {stack.counters > 0 && (
                <span className="stack-counters">+{stack.counters}</span>
              )}
              <span className="stack-badges">
                {stack.sick && <span className="badge sick">Sick</span>}
                {stack.tapped && <span className="badge">Tapped</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}
