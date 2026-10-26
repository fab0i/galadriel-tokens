import { describe, expect, it } from "vitest";
import {
  addCountersToAll,
  addCountersToStack,
  addToken,
  type Board,
  canAttack,
  proliferate,
  removeFromStack,
  resolveCombat,
  setTapped,
  stackKey,
  startTurn,
  tapAttackers,
  totalCount,
} from "./board.ts";

const squirrel = { tokenId: "squirrel", power: 1, toughness: 1, counters: 0 };

function squirrels(n: number): Board {
  let board: Board = [];
  for (let i = 0; i < n; i++) board = addToken(board, squirrel);
  return board;
}

describe("board", () => {
  it("merges identical tokens into one sick, untapped stack", () => {
    expect(squirrels(3)).toEqual([
      { ...squirrel, tapped: false, sick: true, count: 3 },
    ]);
  });

  it("keeps tokens with different counters in separate stacks", () => {
    const board = addToken(addCountersToAll(squirrels(2), 1), squirrel);
    expect(board.map((s) => [s.counters, s.count])).toEqual([
      [1, 2],
      [0, 1],
    ]);
  });

  it("splits a stack when tapping part of it and re-merges on start of turn", () => {
    const board = squirrels(3);
    const tapped = setTapped(board, stackKey(board[0]), 2, true);
    expect(tapped.map((s) => [s.tapped, s.count])).toEqual([
      [false, 1],
      [true, 2],
    ]);
    expect(startTurn(tapped)).toEqual([
      { ...squirrel, tapped: false, sick: false, count: 3 },
    ]);
  });

  it("proliferate only affects stacks that already have counters", () => {
    const board = addToken(addCountersToAll(squirrels(1), 2), squirrel);
    expect(proliferate(board, 1).map((s) => s.counters)).toEqual([3, 0]);
  });

  it("adds counters to part of a stack and never goes below zero", () => {
    const board = squirrels(3);
    const boosted = addCountersToStack(board, stackKey(board[0]), 2, 1);
    expect(boosted.map((s) => [s.counters, s.count])).toEqual([
      [0, 1],
      [1, 2],
    ]);
    expect(
      addCountersToStack(board, stackKey(board[0]), 3, -5)[0].counters,
    ).toBe(0);
  });

  it("taps only the chosen attackers from each stack", () => {
    const board = addToken(startTurn(squirrels(3)), squirrel);
    const ready = board.find(canAttack)!;
    const attacked = tapAttackers(board, { [stackKey(ready)]: 2 });
    expect(attacked.map((s) => [s.tapped, s.sick, s.count])).toEqual([
      [false, false, 1],
      [true, false, 2],
      [false, true, 1],
    ]);
  });

  it("removes dead attackers and taps the surviving ones", () => {
    const board = startTurn(squirrels(4));
    const key = stackKey(board[0]);
    const result = resolveCombat(board, { [key]: 3 }, { [key]: 1 });
    expect(result.map((s) => [s.tapped, s.count])).toEqual([
      [false, 1],
      [true, 2],
    ]);
  });

  it("drops the stack when every attacker dies", () => {
    const board = startTurn(squirrels(2));
    const key = stackKey(board[0]);
    expect(resolveCombat(board, { [key]: 2 }, { [key]: 2 })).toEqual([]);
  });

  it("removes tokens and drops empty stacks", () => {
    const board = squirrels(2);
    expect(totalCount(removeFromStack(board, stackKey(board[0]), 1))).toBe(1);
    expect(removeFromStack(board, stackKey(board[0]), 2)).toEqual([]);
  });
});
