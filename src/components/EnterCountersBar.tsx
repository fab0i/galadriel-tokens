import { useStore } from "../store.ts";
import { CounterStepper } from "./CounterStepper.tsx";

export function EnterCountersBar() {
  const enterCounters = useStore((s) => s.modifiers.enterCounters);
  const updateModifiers = useStore((s) => s.updateModifiers);

  return (
    <div className="enter-bar">
      <CounterStepper
        label="Tokens enter with"
        value={enterCounters}
        onChange={(value) => updateModifiers({ enterCounters: value })}
        min={0}
      />
    </div>
  );
}
