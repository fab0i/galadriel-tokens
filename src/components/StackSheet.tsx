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
import { CounterStepper } from "./CounterStepper.tsx";
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
  const state = [stack.tapped ? "tapped" : "untapped", stack.sick && "sick"]
    .filter(Boolean)
    .join(", ");

  return (
    <Modal title={`${stack.count} × ${pt} ${token.name}`} onClose={onClose}>
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
      <div className="sheet-actions">
        <button
          className="primary"
          onClick={() => run((b) => setTapped(b, key, n, !stack.tapped))}
        >
          {stack.tapped ? "Untap" : "Tap"} {n}
        </button>
        <div className="row-inline">
          <CounterStepper
            label="Counters each"
            value={amount}
            onChange={setAmount}
            min={-stack.counters}
          />
          <button
            className="secondary"
            disabled={amount === 0}
            onClick={() => run((b) => addCountersToStack(b, key, n, amount))}
          >
            {amount >= 0 ? `+${amount}` : amount} on {n}
          </button>
        </div>
        <button
          className="danger"
          onClick={() => run((b) => removeFromStack(b, key, n))}
        >
          Remove {n}
        </button>
      </div>
    </Modal>
  );
}
