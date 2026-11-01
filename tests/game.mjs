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

test("selected win modes detect corners and full cards independently", () => {
  const game = createGame();
  const corners = [0, 4, 20, 24];
  const marked = corners.map((i) => game.card[i]);
  const cornerGame = { ...game, marked };
  assert.deepEqual(winningCells(cornerGame, ["corners"]), corners);
  assert.deepEqual(winningCells(cornerGame, ["full"]), []);
  assert.deepEqual(winningCells(cornerGame, []), []);
  assert.deepEqual(
    winningCells({ ...game, marked: marked.slice(1) }, ["corners"]),
    [],
  );
  const full = { ...game, marked: game.card.filter((n) => n !== null) };
  assert.equal(winningCells(full, ["full"]).length, 25);
  assert.equal(winningCells(full, ["corners", "full"]).length, 25);
  assert.deepEqual(
    winningCells({ ...full, marked: full.marked.slice(1) }, ["full"]),
    [],
  );
  assert.deepEqual(
    winningCells({ ...game, marked: game.card.slice(0, 5) }, [
      "corners",
      "full",
    ]),
    [],
  );
});

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

test("horizontal and vertical lines and diagonals respect selected modes", () => {
  const game = createGame();
  for (const [index, line] of lines.entries()) {
    const mode = index < 10 ? "straight" : "diagonal";
    const other = index < 10 ? "diagonal" : "straight";
    const marked = line.map((i) => game.card[i]).filter((n) => n !== null);
    assert.deepEqual(winningCells({ ...game, marked }, [mode]), line);
    assert.deepEqual(winningCells({ ...game, marked }, [other]), []);
    assert.deepEqual(
      winningCells({ ...game, marked: marked.slice(1) }, [mode]),
      [],
    );
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

import {
  restoreCollection,
  addCard,
  removeCard,
  toggleCardNumber,
} from "../.test-build/engine.js";

test("migrates a saved card and its marks into a collection", () => {
  const game = createGame();
  game.marked = [game.card[0], game.card[1]];
  const restored = restoreCollection(game);
  assert.equal(restored.version, 3);
  assert.equal(restored.cards.length, 1);
  assert.deepEqual(restored.cards[0].game, game);
  const legacy = restoreCollection({
    version: 1,
    card: game.card,
    drawn: game.marked,
  });
  assert.deepEqual(legacy.cards[0].game, game);
});

test("adds cards without replacing existing numbers or marks and toggles only the selected card", () => {
  const game = createGame();
  const original = {
    version: 3,
    cards: [{ id: "first", game: { ...game, marked: [game.card[0]] } }],
  };
  const added = addCard(original, game, "second");
  assert.equal(added.cards.length, 2);
  assert.deepEqual(added.cards[0], original.cards[0]);
  const marked = toggleCardNumber(added, "second", game.card[1]);
  assert.deepEqual(marked.cards[0].game.marked, [game.card[0]]);
  assert.deepEqual(marked.cards[1].game.marked, [game.card[1]]);
  assert.deepEqual(
    restoreCollection(JSON.parse(JSON.stringify(marked))),
    marked,
  );
  assert.equal(addCard(added, game, "first"), added);
});

test("deletes only the selected card and persists an empty collection", () => {
  const first = { id: "a", game: createGame() };
  const second = { id: "b", game: createGame() };
  const collection = { version: 3, cards: [first, second] };
  const removed = removeCard(collection, "a");
  assert.deepEqual(removed.cards, [second]);
  assert.deepEqual(removeCard(collection, "missing"), collection);
  assert.deepEqual(restoreCollection(removeCard(removed, "b")), {
    version: 3,
    cards: [],
  });
});

test("rejects invalid collections and duplicate identifiers", () => {
  const entry = { id: "a", game: createGame() };
  for (const value of [
    { version: 3 },
    { version: 3, cards: [entry, entry] },
    { version: 3, cards: [null] },
    { version: 3, cards: [{ ...entry, id: "" }] },
    { version: 3, cards: [{ ...entry, game: {} }] },
  ])
    assert.equal(restoreCollection(value), null);
});

import { numberMarkState, toggleAllCardNumber } from "../.test-build/engine.js";

test("number board synchronizes mixed marks, preserves other marks and persists", () => {
  const game = createGame();
  const number = game.card[0];
  const other = game.card[1];
  const absentGame = {
    ...game,
    card: game.card.map((n) =>
      n === number
        ? Array.from({ length: 15 }, (_, i) => i + 1).find(
            (candidate) => !game.card.includes(candidate),
          )
        : n,
    ),
  };
  const collection = {
    version: 3,
    cards: [
      { id: "a", game: { ...game, marked: [number, other] } },
      { id: "b", game },
      { id: "c", game: absentGame },
    ],
  };
  assert.deepEqual(numberMarkState(collection, number), {
    count: 2,
    pressed: "mixed",
  });
  const marked = toggleAllCardNumber(collection, number);
  assert.equal(numberMarkState(marked, number).pressed, true);
  assert.deepEqual(marked.cards[0].game.marked, [other, number]);
  assert.deepEqual(marked.cards[1].game.marked, [number]);
  assert.equal(marked.cards[2], collection.cards[2]);
  assert.deepEqual(
    restoreCollection(JSON.parse(JSON.stringify(marked))),
    marked,
  );
  const cleared = toggleAllCardNumber(marked, number);
  assert.equal(numberMarkState(cleared, number).pressed, false);
  assert.deepEqual(cleared.cards[0].game.marked, [other]);
  assert.deepEqual(cleared.cards[1].game.marked, []);
  assert.equal(
    numberMarkState(toggleAllCardNumber(cleared, number), number).pressed,
    true,
  );
  assert.equal(toggleAllCardNumber(collection, 76), collection);
  assert.deepEqual(numberMarkState({ version: 3, cards: [] }, number), {
    count: 0,
    pressed: false,
  });
});
