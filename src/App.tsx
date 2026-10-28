import { useState } from "react";
import {
  addCountersToAll,
  canAttack,
  proliferate,
  startTurn,
  totalCount,
} from "./board.ts";
import { AddTokenDialog } from "./components/AddTokenDialog.tsx";
import { CombatView } from "./components/CombatView.tsx";
import { EnterCountersBar } from "./components/EnterCountersBar.tsx";
import { EnterDialog } from "./components/EnterDialog.tsx";
import { GearIcon, RedoIcon, UndoIcon } from "./components/icons.tsx";
import { SettingsDialog } from "./components/SettingsDialog.tsx";
import { StackSheet } from "./components/StackSheet.tsx";
import { TokenCard } from "./components/TokenCard.tsx";
import { useWakeLock } from "./hooks.ts";
import { newCombat, useStore } from "./store.ts";
import type { Stack, TokenDef } from "./types.ts";

type Dialog =
  | { kind: "add" }
  | { kind: "settings" }
  | { kind: "stack"; stack: Stack }
  | { kind: "enter"; token: TokenDef };

export default function App() {
  const {
    board,
    combat,
    past,
    future,
    catalog,
    settings,
    modifiers,
    apply,
    updateModifiers,
    setCombat,
    undo,
    redo,
  } = useStore();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const inCombat = combat !== null;
  const close = () => setDialog(null);
  useWakeLock(settings.wakeLock);

  const tokenIds = [...new Set(board.map((s) => s.tokenId))];
  const amount = modifiers.counterAmount;
  const setAmount = (counterAmount: number) =>
    updateModifiers({ counterAmount });

  return (
    <div className="app">
      <header className="top-bar">
        <h1>
          {inCombat ? "Combat" : "Tokens"}{" "}
          <span className="muted">{totalCount(board)}</span>
        </h1>
        <div className="top-bar-actions">
          <button
            className="icon-button"
            onClick={undo}
            disabled={!past.length}
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            className="icon-button"
            onClick={redo}
            disabled={!future.length}
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
          <button
            className="primary"
            onClick={() => setDialog({ kind: "add" })}
          >
            + Token
          </button>
          <button
            className="icon-button"
            onClick={() => setDialog({ kind: "settings" })}
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      {inCombat ? (
        <CombatView />
      ) : (
        <>
          <main className="board">
            {tokenIds.length === 0 ? (
              <div className="empty">
                <p>No tokens on the board.</p>
                <button
                  className="primary"
                  onClick={() => setDialog({ kind: "add" })}
                >
                  + Token
                </button>
              </div>
            ) : (
              tokenIds.map((id) => (
                <TokenCard
                  key={id}
                  token={catalog[id]}
                  stacks={board.filter((s) => s.tokenId === id)}
                  onOpenStack={(stack) => setDialog({ kind: "stack", stack })}
                  onCustomEnter={(token) => setDialog({ kind: "enter", token })}
                />
              ))
            )}
          </main>

          {(settings.showEnterCounters || modifiers.enterCounters !== 0) && (
            <EnterCountersBar />
          )}

          <footer className="action-bar">
            <button
              className="secondary"
              disabled={!board.length}
              onClick={() => apply(startTurn)}
            >
              Start my turn
            </button>
            <button
              className="secondary combat"
              disabled={!board.some(canAttack)}
              onClick={() => setCombat(newCombat())}
            >
              Combat
            </button>
            <button
              className="secondary small"
              disabled={!board.length}
              onClick={() => apply((b) => proliferate(b, amount))}
            >
              Proliferate
            </button>
            <div className="amount-group">
              <button
                className="secondary"
                aria-label="Decrease counters placed"
                disabled={amount <= 1}
                onClick={() => setAmount(amount - 1)}
              >
                −
              </button>
              <button
                className="primary big"
                disabled={!board.length}
                onClick={() => apply((b) => addCountersToAll(b, amount))}
              >
                +{amount}/+{amount} all
              </button>
              <button
                className="secondary"
                aria-label="Increase counters placed"
                onClick={() => setAmount(amount + 1)}
              >
                +
              </button>
            </div>
          </footer>
        </>
      )}

      {dialog?.kind === "add" && <AddTokenDialog onClose={close} />}
      {dialog?.kind === "settings" && <SettingsDialog onClose={close} />}
      {dialog?.kind === "stack" && (
        <StackSheet
          stack={dialog.stack}
          token={catalog[dialog.stack.tokenId]}
          onClose={close}
        />
      )}
      {dialog?.kind === "enter" && (
        <EnterDialog token={dialog.token} onClose={close} />
      )}
    </div>
  );
}
