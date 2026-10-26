import { useState } from "react";
import { useStore } from "../store.ts";
import type { TokenDef } from "../types.ts";
import { Modal } from "./Modal.tsx";
import { Stepper } from "./Stepper.tsx";

interface Props {
  token: TokenDef;
  onClose: () => void;
}

export function EnterDialog({ token, onClose }: Props) {
  const createToken = useStore((s) => s.createToken);
  const enterCounters = useStore((s) => s.settings.enterCounters);
  const [power, setPower] = useState(token.power);
  const [toughness, setToughness] = useState(token.toughness);
  const [counters, setCounters] = useState(enterCounters);

  return (
    <Modal title={`New ${token.name}`} onClose={onClose}>
      <Stepper label="Base power" value={power} onChange={setPower} min={0} />
      <Stepper
        label="Base toughness"
        value={toughness}
        onChange={setToughness}
        min={0}
      />
      <Stepper
        label="+1/+1 counters"
        value={counters}
        onChange={setCounters}
        min={0}
      />
      <button
        className="primary full"
        onClick={() => {
          createToken(token, { power, toughness, counters });
          onClose();
        }}
      >
        Create {power + counters}/{toughness + counters}
      </button>
    </Modal>
  );
}
