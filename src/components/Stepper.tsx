import type { ReactNode } from "react";

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  leading?: ReactNode;
  // Renders a read-only formatted value in place of the editable number input.
  display?: (value: number) => string;
}

export function Stepper({
  label,
  value,
  onChange,
  min = -99,
  max = 999,
  leading,
  display,
}: StepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <label className="stepper">
      <span className="stepper-label">{label}</span>
      <span className="stepper-controls">
        {leading}
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        {display ? (
          <output className="stepper-value">{display(value)}</output>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed)) set(parsed);
            }}
            onFocus={(e) => e.target.select()}
          />
        )}
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </span>
    </label>
  );
}
