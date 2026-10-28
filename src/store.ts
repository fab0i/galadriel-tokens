import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addToken, type Board, resolveCombat } from "./board.ts";
import defaultTokens from "./defaultTokens.json";
import type { Modifiers, Settings, TokenDef } from "./types.ts";

const UNDO_LIMIT = 50;

const DEFAULT_MODIFIERS: Modifiers = { enterCounters: 0, counterAmount: 1 };

export interface EnteringStats {
  power: number;
  toughness: number;
  counters: number;
}

export interface Combat {
  // One map per attack target of tokens sent, keyed by stack key.
  targets: Record<string, number>[];
  // Attackers marked as dying, keyed by stack key.
  dead: Record<string, number>;
}

export const newCombat = (): Combat => ({ targets: [{}], dead: {} });

interface Snapshot {
  board: Board;
  combat: Combat | null;
  modifiers: Modifiers;
}

interface State {
  library: TokenDef[];
  // Every token the board has referenced, so stacks survive removal from the library.
  catalog: Record<string, TokenDef>;
  board: Board;
  // Non-null while in combat. Lives beside the board so undo/redo restore them together.
  combat: Combat | null;
  past: Snapshot[];
  future: Snapshot[];
  settings: Settings;
  modifiers: Modifiers;
  apply: (update: (board: Board) => Board) => void;
  newGame: () => void;
  setCombat: (combat: Combat | null) => void;
  finishCombat: (
    sent: Record<string, number>,
    dead: Record<string, number>,
  ) => void;
  createToken: (token: TokenDef, stats?: EnteringStats) => void;
  undo: () => void;
  redo: () => void;
  addToLibrary: (tokens: TokenDef[]) => void;
  removeFromLibrary: (id: string) => void;
  resetLibrary: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateModifiers: (patch: Partial<Modifiers>) => void;
}

function sortByName(tokens: TokenDef[]): TokenDef[] {
  return [...tokens].sort((a, b) => a.name.localeCompare(b.name));
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const commit = (patch: Partial<Snapshot>) =>
        set(({ board, combat, modifiers, past }) => {
          const next = { board, combat, modifiers, ...patch };
          if (
            next.board === board &&
            next.combat === combat &&
            next.modifiers === modifiers
          ) {
            return {};
          }
          return {
            ...next,
            past: [...past, { board, combat, modifiers }].slice(-UNDO_LIMIT),
            future: [],
          };
        });

      return {
        library: defaultTokens,
        catalog: {},
        board: [],
        combat: null,
        past: [],
        future: [],
        settings: { wakeLock: false, showEnterCounters: false },
        modifiers: DEFAULT_MODIFIERS,
        apply: (update) => commit({ board: update(get().board) }),
        newGame: () =>
          commit({ board: [], combat: null, modifiers: DEFAULT_MODIFIERS }),
        setCombat: (combat) => commit({ combat }),
        finishCombat: (sent, dead) =>
          commit({
            board: resolveCombat(get().board, sent, dead),
            combat: null,
          }),
        createToken: (token, stats) => {
          set(({ catalog }) => ({
            catalog: { ...catalog, [token.id]: token },
          }));
          const { power, toughness, counters } = stats ?? {
            power: token.power,
            toughness: token.toughness,
            counters: get().modifiers.enterCounters,
          };
          get().apply((board) =>
            addToken(board, { tokenId: token.id, power, toughness, counters }),
          );
        },
        undo: () =>
          set(({ board, combat, modifiers, past, future }) =>
            past.length
              ? {
                  ...past[past.length - 1],
                  past: past.slice(0, -1),
                  future: [{ board, combat, modifiers }, ...future],
                }
              : {},
          ),
        redo: () =>
          set(({ board, combat, modifiers, past, future }) =>
            future.length
              ? {
                  ...future[0],
                  past: [...past, { board, combat, modifiers }],
                  future: future.slice(1),
                }
              : {},
          ),
        addToLibrary: (tokens) =>
          set(({ library }) => ({
            library: sortByName([
              ...library,
              ...tokens.filter((t) => !library.some((l) => l.id === t.id)),
            ]),
          })),
        removeFromLibrary: (id) =>
          set(({ library }) => ({
            library: library.filter((t) => t.id !== id),
          })),
        resetLibrary: () => set({ library: defaultTokens }),
        updateSettings: (patch) =>
          set(({ settings }) => ({ settings: { ...settings, ...patch } })),
        updateModifiers: (patch) =>
          commit({ modifiers: { ...get().modifiers, ...patch } }),
      };
    },
    {
      name: "galadriel-tokens",
      version: 5,
      migrate: (persisted, version) => {
        const old = persisted as {
          past?: unknown[];
          future?: unknown[];
          combat?: unknown;
          settings?: Partial<Settings & Modifiers>;
          modifiers?: Modifiers;
        };
        // v3 and earlier kept the modifiers inside settings.
        const { enterCounters, counterAmount, ...settings } =
          old.settings ?? {};
        const modifiers = old.modifiers ?? {
          enterCounters: enterCounters ?? DEFAULT_MODIFIERS.enterCounters,
          counterAmount: counterAmount ?? DEFAULT_MODIFIERS.counterAmount,
        };
        // v1 history held bare boards; v2 combat was a bare targets array.
        const upgradeCombat = (c: unknown) =>
          Array.isArray(c) ? { targets: c, dead: {} } : c;
        const upgradeSnapshot = (entry: unknown) =>
          version < 2
            ? { board: entry, combat: null, modifiers }
            : {
                modifiers,
                ...(entry as object),
                combat: upgradeCombat((entry as { combat?: unknown }).combat),
              };
        return {
          ...old,
          settings,
          modifiers,
          past: (old.past ?? []).map(upgradeSnapshot),
          future: (old.future ?? []).map(upgradeSnapshot),
          combat: upgradeCombat(old.combat ?? null),
        } as unknown as State;
      },
    },
  ),
);
