import { useState } from "react";
import {
  addCountersToStack,
  removeFromStack,
  setTapped,
  stackKey,
  stackPower,
  stackToughness,
} from "../board.ts";
import { useStore } from "../store.ts";
import type { Stack, TokenDef } from "../types.ts";
import { formatCounters } from "./CounterStepper.tsx";
import { Modal } from "./Modal.tsx";
import { Stepper } from "./Stepper.tsx";

interface Props {
  stack: Stack;
  token: TokenDef;
  onClose: () => void;
}

export function StackSheet({ stack, token, onClose }: Props) {
  const apply = useStore((s) => s.apply);
  const counterAmount = useStore((s) => s.modifiers.counterAmount);
  const bonus = useStore((s) => s.modifiers.typeBonuses[token.id] ?? 0);
  const [n, setN] = useState(1);
  const [amount, setAmount] = useState(counterAmount);
  const key = stackKey(stack);

  const run = (update: Parameters<typeof apply>[0]) => {
    apply(update);
    onClose();
  };

  const pt = `${stackPower(stack, bonus)}/${stackToughness(stack, bonus)}`;
  const state = [stack.tapped ? "Tapped" : "Untapped", stack.sick && "Sick"]
    .filter(Boolean)
    .join(", ");

  return (
    <Modal title={`${stack.count} × ${pt} ${token.name}`} onClose={onClose}>
      <div className="sheet-section">
        <p className="muted">{state}</p>
        {stack.count > 1 && (
          <div className="row-inline">
            <Stepper
              label="How many"
              value={n}
              onChange={setN}
              min={1}
              max={stack.count}
              leading={
                <button
                  type="button"
                  className="secondary"
                  aria-label="One"
                  onClick={() => setN(1)}
                >
                  One
                </button>
              }
            />
            <button className="secondary" onClick={() => setN(stack.count)}>
              All
            </button>
          </div>
        )}
      </div>
      <div className="sheet-section sheet-actions">
        {stack.count > 1 && (
          <p className="muted">
            Apply to {n} of {stack.count}
          </p>
        )}
        <div className="stepper">
          <span className="stepper-label">Add or remove counters</span>
          <div className="amount-group">
            <button
              className="secondary"
              aria-label="Decrease counters each"
              disabled={amount <= -stack.counters}
              onClick={() => setAmount(amount - 1)}
            >
              −
            </button>
            <button
              className={amount < 0 ? "counter negative" : "counter"}
              disabled={amount === 0}
              onClick={() => run((b) => addCountersToStack(b, key, n, amount))}
            >
              {formatCounters(amount)} on {n}
            </button>
            <button
              className="secondary"
              aria-label="Increase counters each"
              onClick={() => setAmount(amount + 1)}
            >
              +
            </button>
          </div>
        </div>
        <div className="sheet-pair">
          <button
            className="danger"
            onClick={() => run((b) => removeFromStack(b, key, n))}
          >
            Remove {n}
          </button>
          <button
            className="primary"
            onClick={() => run((b) => setTapped(b, key, n, !stack.tapped))}
          >
            {stack.tapped ? "Untap" : "Tap"} {n}
          </button>
        </div>
      </div>
    </Modal>
  );
}
