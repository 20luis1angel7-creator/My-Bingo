import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  toggleNumber,
  winningCells,
  isGame,
  lines,
  restoreGame,
} from "../.test-build/engine.js";

test("generated cards have a free center, 24 unique numbers and correct column ranges", () => {
  for (let i = 0; i < 200; i++) {
    const game = createGame();
    assert.ok(isGame(game));
    assert.equal(game.card[12], null);
    assert.equal(new Set(game.card.filter((n) => n !== null)).size, 24);
    assert.deepEqual(winningCells(game), []);
  }
});

test("all rows, columns and diagonals win, but incomplete patterns do not", () => {
  const game = createGame();
  for (const line of lines) {
    const marked = line.map((i) => game.card[i]).filter((n) => n !== null);
    assert.deepEqual(
      winningCells({ ...game, marked }).sort((a, b) => a - b),
      [...line].sort((a, b) => a - b),
    );
    assert.deepEqual(winningCells({ ...game, marked: marked.slice(1) }), []);
  }
});

test("manual marking toggles, rejects absent numbers and allows correcting bingo", () => {
  const game = createGame();
  const number = game.card[0];
  const marked = toggleNumber(game, number);
  assert.deepEqual(marked.marked, [number]);
  assert.deepEqual(toggleNumber(marked, number), game);
  assert.equal(toggleNumber(game, 76), game);
  let winner = game;
  for (const n of game.card.slice(0, 5)) winner = toggleNumber(winner, n);
  assert.equal(winningCells(winner).length, 5);
  assert.deepEqual(winningCells(toggleNumber(winner, number)), []);
});

test("rejects malformed saved games", () => {
  const game = createGame();
  for (const value of [
    null,
    {},
    { ...game, version: 3 },
    { ...game, marked: [1, 1] },
    { ...game, marked: [76] },
    { ...game, marked: ["1"] },
    { ...game, card: [] },
    { ...game, card: game.card.map((n, i) => (i === 0 ? 75 : n)) },
  ])
    assert.equal(isGame(value), false);
  assert.ok(isGame(JSON.parse(JSON.stringify(game))));
});

test("migrates previous games preserving card and matching marks", () => {
  const game = createGame();
  const restored = restoreGame({
    version: 1,
    card: game.card,
    drawn: [game.card[0], 76],
  });
  assert.deepEqual(restored, { ...game, marked: [game.card[0]] });
  assert.equal(restoreGame({}), null);
});
