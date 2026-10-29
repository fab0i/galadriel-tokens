import { useState } from "react";
import { removeToken, totalCount } from "../board.ts";
import { useStore } from "../store.ts";
import type { TokenDef } from "../types.ts";
import { CounterStepper, formatCounters } from "./CounterStepper.tsx";
import { Modal } from "./Modal.tsx";

interface Props {
  token: TokenDef;
  onClose: () => void;
}

export function TypeBonusDialog({ token, onClose }: Props) {
  const current = useStore((s) => s.modifiers.typeBonuses[token.id] ?? 0);
  const onBoard = useStore((s) =>
    totalCount(s.board.filter((stack) => stack.tokenId === token.id)),
  );
  const setTypeBonus = useStore((s) => s.setTypeBonus);
  const apply = useStore((s) => s.apply);
  const [bonus, setBonus] = useState(current);

  return (
    <Modal title={`All ${token.name} tokens`} onClose={onClose}>
      <CounterStepper label="Bonus to all" value={bonus} onChange={setBonus} />
      <button
        className={bonus < 0 ? "counter negative full" : "counter full"}
        disabled={bonus === current}
        onClick={() => {
          setTypeBonus(token.id, bonus);
          onClose();
        }}
      >
        {bonus === 0 ? "Remove bonus" : `Set ${formatCounters(bonus)}`}
      </button>
      <button
        className="danger full"
        onClick={() => {
          apply((board) => removeToken(board, token.id));
          onClose();
        }}
      >
        Remove all {onBoard}
      </button>
    </Modal>
  );
}
