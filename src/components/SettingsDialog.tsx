import { wakeLockSupported } from "../hooks.ts";
import { useStore } from "../store.ts";
import { Modal } from "./Modal.tsx";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, newGame } = useStore();

  return (
    <Modal title="Settings" onClose={onClose}>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.showEnterCounters}
          onChange={(e) =>
            updateSettings({ showEnterCounters: e.target.checked })
          }
        />
        Show "Tokens enter with" counter control
      </label>
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
          newGame();
          onClose();
        }}
      >
        New game (clear board)
      </button>
    </Modal>
  );
}
