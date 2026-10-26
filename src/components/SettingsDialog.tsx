import { wakeLockSupported } from "../hooks.ts";
import { useStore } from "../store.ts";
import { Modal } from "./Modal.tsx";
import { Stepper } from "./Stepper.tsx";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, apply } = useStore();

  return (
    <Modal title="Settings" onClose={onClose}>
      <Stepper
        label="Tokens enter with +1/+1 counters"
        value={settings.enterCounters}
        onChange={(enterCounters) => updateSettings({ enterCounters })}
        min={0}
      />
      <Stepper
        label="Each counter placed becomes"
        value={settings.counterAmount}
        onChange={(counterAmount) => updateSettings({ counterAmount })}
        min={1}
      />
      <p className="muted small">
        Used by "+1/+1 all", Proliferate and per-stack counters. E.g. Hardened
        Scales + Conclave Mentor = 3.
      </p>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.wakeLock}
          disabled={!wakeLockSupported}
          onChange={(e) => updateSettings({ wakeLock: e.target.checked })}
        />
        Keep screen awake{" "}
        {!wakeLockSupported && (
          <span className="muted">(not supported in this browser)</span>
        )}
      </label>
      <button
        className="danger full"
        onClick={() => {
          if (!window.confirm("Clear all tokens from the board?")) return;
          apply(() => []);
          onClose();
        }}
      >
        New game (clear board)
      </button>
    </Modal>
  );
}
