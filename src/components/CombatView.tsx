import { useState } from "react";
import {
  attackPower,
  canAttack,
  compareStacks,
  stackKey,
  stackPower,
  stackToughness,
} from "../board.ts";
import { type Combat, newCombat, useStore } from "../store.ts";
import type { Stack } from "../types.ts";
import { TokenArt } from "./TokenArt.tsx";

export function CombatView() {
  const { board, catalog, combat, modifiers, setCombat, finishCombat } =
    useStore();
  const bonusOf = (s: Stack) => modifiers.typeBonuses[s.tokenId] ?? 0;
  // Untouched stacks stay home, including ones created mid-combat.
  const current = combat ?? newCombat();
  const { targets, dead } = current;
  const [selected, setActive] = useState(0);
  // Undo can remove the selected target.
  const active = Math.min(selected, targets.length - 1);
  const [showTargets, setShowTargets] = useState(targets.length > 1);
  const [casualties, setCasualties] = useState(false);
  const setTargets = (update: (prev: Combat["targets"]) => Combat["targets"]) =>
    setCombat({ ...current, targets: update(targets) });

  const eligible = board.filter(canAttack);
  const assignedTo = (target: number, s: Stack) =>
    canAttack(s) ? Math.min(targets[target][stackKey(s)] ?? 0, s.count) : 0;
  const elsewhere = (s: Stack) =>
    targets.reduce(
      (sum, _, t) => (t === active ? sum : sum + assignedTo(t, s)),
      0,
    );
  const available = (s: Stack) => s.count - elsewhere(s);
  const attackers = (s: Stack) => Math.min(assignedTo(active, s), available(s));
  const sentTotal = (s: Stack) =>
    Math.min(
      targets.reduce((sum, _, t) => sum + assignedTo(t, s), 0),
      s.count,
    );
  const setAttackers = (s: Stack, n: number) =>
    setTargets((prev) =>
      prev.map((sent, t) =>
        t === active
          ? { ...sent, [stackKey(s)]: Math.min(available(s), Math.max(0, n)) }
          : sent,
      ),
    );

  const deadOf = (s: Stack) => Math.min(dead[stackKey(s)] ?? 0, sentTotal(s));
  const setDead = (s: Stack, n: number) =>
    setCombat({
      ...current,
      dead: { ...dead, [stackKey(s)]: Math.min(sentTotal(s), Math.max(0, n)) },
    });

  const attackerCount = eligible.reduce((sum, s) => sum + sentTotal(s), 0);
  const totalPower = eligible.reduce(
    (sum, s) => sum + sentTotal(s) * attackPower(s, bonusOf(s)),
    0,
  );
  const targetStats = targets.map((_, t) => ({
    count: eligible.reduce((sum, s) => sum + assignedTo(t, s), 0),
    power: eligible.reduce(
      (sum, s) => sum + assignedTo(t, s) * attackPower(s, bonusOf(s)),
      0,
    ),
  }));
  const shown = showTargets
    ? targetStats[active]
    : { count: attackerCount, power: totalPower };
  const allAttacking = eligible.every((s) => attackers(s) === available(s));
  const deadCount = eligible.reduce((sum, s) => sum + deadOf(s), 0);
  const allDead = eligible.every((s) => deadOf(s) === sentTotal(s));

  const tokenIds = [...new Set(board.map((s) => s.tokenId))].sort(
    (a, b) =>
      Number(!eligible.some((s) => s.tokenId === a)) -
      Number(!eligible.some((s) => s.tokenId === b)),
  );

  const toggleAll = () =>
    setTargets((prev) =>
      prev.map((sent, t) =>
        t === active
          ? allAttacking
            ? {}
            : Object.fromEntries(
                eligible.map((s) => [stackKey(s), available(s)]),
              )
          : sent,
      ),
    );

  const toggleAllDead = () =>
    setCombat({
      ...current,
      dead: allDead
        ? {}
        : Object.fromEntries(eligible.map((s) => [stackKey(s), sentTotal(s)])),
    });

  const toggleTargets = () => {
    setShowTargets((shown) => !shown);
    setCasualties(false);
    setActive(0);
  };

  const toggleCasualties = () => {
    setCasualties((on) => !on);
    setShowTargets(false);
  };

  const addTarget = () => {
    setTargets((prev) => [...prev, {}]);
    setActive(targets.length);
  };

  const finish = () =>
    finishCombat(
      Object.fromEntries(eligible.map((s) => [stackKey(s), sentTotal(s)])),
      Object.fromEntries(eligible.map((s) => [stackKey(s), deadOf(s)])),
    );

  return (
    <>
      <main className="board">
        {tokenIds.map((id) => {
          const token = catalog[id];
          const stacks = board
            .filter((s) => s.tokenId === id)
            .sort(compareStacks);
          const count = stacks.reduce((sum, s) => sum + sentTotal(s), 0);
          const power = stacks.reduce(
            (sum, s) => sum + sentTotal(s) * attackPower(s, bonusOf(s)),
            0,
          );
          const dying = stacks.reduce((sum, s) => sum + deadOf(s), 0);
          return (
            <article key={id} className="token-card">
              <header className="token-card-header">
                <TokenArt token={token} />
                <div className="token-card-title">
                  <h3>{token.name}</h3>
                  <span>
                    {casualties
                      ? `${dying} of ${count} dying`
                      : `${count} attacking · ${power} power`}
                  </span>
                </div>
              </header>
              <ul className="stack-rows">
                {stacks.map((stack) => (
                  <CombatRow
                    key={stackKey(stack)}
                    stack={stack}
                    bonus={bonusOf(stack)}
                    mode={casualties ? "casualties" : "attack"}
                    value={casualties ? deadOf(stack) : attackers(stack)}
                    max={casualties ? sentTotal(stack) : available(stack)}
                    elsewhere={
                      casualties
                        ? []
                        : targets
                            .map((_, t) => ({
                              target: t,
                              n: t === active ? 0 : assignedTo(t, stack),
                            }))
                            .filter((e) => e.n > 0)
                    }
                    onChange={(n) =>
                      casualties ? setDead(stack, n) : setAttackers(stack, n)
                    }
                  />
                ))}
              </ul>
            </article>
          );
        })}
      </main>

      <div className="combat-dock">
        {showTargets && (
          <div className="targets-bar">
            {targetStats.map((stats, t) => (
              <button
                key={t}
                className={`target-tab ${t === active ? "active" : ""}`}
                aria-pressed={t === active}
                onClick={() => setActive(t)}
              >
                <span className="target-name">Target {t + 1}</span>
                <strong className="target-power">{stats.power}</strong>
                <span className="target-detail">
                  power · {stats.count}{" "}
                  {stats.count === 1 ? "attacker" : "attackers"}
                </span>
              </button>
            ))}
            <button
              className="combat-step"
              onClick={addTarget}
              aria-label="Add target"
            >
              +
            </button>
          </div>
        )}
        <footer className="action-bar">
          <div className="combat-total">
            {casualties ? (
              <>
                <strong>{deadCount}</strong>
                <span className="muted">
                  dying · {attackerCount - deadCount} surviving
                </span>
              </>
            ) : (
              <>
                <strong>{shown.power}</strong>
                <span className="muted">
                  power · {shown.count}{" "}
                  {shown.count === 1 ? "attacker" : "attackers"}
                </span>
              </>
            )}
          </div>
          <button className="secondary" onClick={() => setCombat(null)}>
            Cancel
          </button>
          <button
            className="secondary"
            aria-pressed={showTargets}
            onClick={toggleTargets}
          >
            Targets
          </button>
          <button
            className="secondary"
            aria-pressed={casualties}
            disabled={!attackerCount}
            onClick={toggleCasualties}
          >
            Casualties
          </button>
          <button
            className="secondary"
            disabled={casualties ? !attackerCount : !eligible.length}
            onClick={casualties ? toggleAllDead : toggleAll}
          >
            {(casualties ? allDead : allAttacking) ? "None" : "All"}
          </button>
          <button
            className="primary big"
            disabled={!attackerCount}
            onClick={finish}
          >
            Finish
          </button>
        </footer>
      </div>
    </>
  );
}

interface RowProps {
  stack: Stack;
  bonus: number;
  mode: "attack" | "casualties";
  value: number;
  max: number;
  elsewhere: { target: number; n: number }[];
  onChange: (n: number) => void;
}

function CombatRow({
  stack,
  bonus,
  mode,
  value,
  max,
  elsewhere,
  onChange,
}: RowProps) {
  const casualties = mode === "casualties";
  const pt = (
    <span className="stack-pt">
      {stackPower(stack, bonus)}/{stackToughness(stack, bonus)}
    </span>
  );

  const elsewhereBadges = elsewhere.map((e) => (
    <span key={e.target} className="badge">
      T{e.target + 1} ×{e.n}
    </span>
  ));

  if (!canAttack(stack) || max === 0) {
    return (
      <li className="combat-row">
        <div className="stack-row tapped">
          <span className="stack-count">×{stack.count}</span>
          {pt}
          <span className="stack-badges">
            {stack.tapped && <span className="badge">Tapped</span>}
            {stack.sick && <span className="badge sick">Sick</span>}
            {elsewhereBadges}
          </span>
        </div>
      </li>
    );
  }

  const rowState = casualties
    ? value
      ? "dying"
      : ""
    : value
      ? "attacking"
      : "held";
  const subject = casualties ? "dying token" : "attacker";

  return (
    <li className="combat-row">
      <button
        className={`stack-row ${rowState}`}
        aria-pressed={value > 0}
        onClick={() => onChange(value === max ? 0 : max)}
      >
        {pt}
        <span className="stack-badges">
          <span
            className={`badge ${value ? (casualties ? "dying" : "attack") : ""}`}
          >
            {value} of {max}
            {casualties && " dying"}
          </span>
          {elsewhereBadges}
        </span>
      </button>
      <button
        className="combat-step"
        disabled={!value}
        onClick={() => onChange(value - 1)}
        aria-label={`One fewer ${subject}`}
      >
        −
      </button>
      <button
        className="combat-step"
        disabled={value === max}
        onClick={() => onChange(value + 1)}
        aria-label={`One more ${subject}`}
      >
        +
      </button>
    </li>
  );
}
