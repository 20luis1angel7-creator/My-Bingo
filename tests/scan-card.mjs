import { test } from "node:test";
import assert from "node:assert/strict";
import { wordsToCard } from "../.test-build/scan-card.js";

const words = Array.from({ length: 25 }, (_, i) => ({
  text: String((i % 5) * 15 + Math.floor(i / 5) + 1),
  bbox: {
    x0: (i % 5) * 100,
    x1: (i % 5) * 100 + 40,
    y0: Math.floor(i / 5) * 100,
    y1: Math.floor(i / 5) * 100 + 40,
  },
})).filter((_, i) => i !== 12);

test("OCR preserves row positions, ignores headers and keeps the free center", () => {
  const card = wordsToCard([
    { text: "BINGO", bbox: { x0: 0, x1: 400, y0: -100, y1: -60 } },
    ...words.toReversed(),
  ]);
  assert.deepEqual(
    card,
    Array.from({ length: 25 }, (_, i) =>
      i === 12 ? "" : String((i % 5) * 15 + Math.floor(i / 5) + 1),
    ),
  );
});

test("unread and ambiguous numbers leave blanks instead of shifting other cells", () => {
  const card = wordsToCard(words.filter((w) => w.text !== "17"));
  assert.equal(card[6], "");
  assert.equal(card[11], "18");
  assert.equal(wordsToCard([...words, { ...words[0], text: "9" }])[0], "");
});

test("preserves an unread interior row instead of rejecting the whole card", () => {
  const card = wordsToCard(words.filter((w) => w.bbox.y0 !== 200));
  assert.deepEqual(card.slice(10, 15), ["", "", "", "", ""]);
  assert.equal(card[15], "4");
});

test("accepts rows with only two recognized numbers", () => {
  const card = wordsToCard(
    words.filter((w) => w.bbox.y0 !== 100 || ["2", "17"].includes(w.text)),
  );
  assert.deepEqual(card.slice(5, 10), ["2", "17", "", "", ""]);
});

test("rejects blank images, ambiguous outer rows and multiple cards", () => {
  assert.throws(() => wordsToCard([]));
  assert.throws(() => wordsToCard(words.filter((w) => w.bbox.y0 !== 0)));
  assert.throws(() =>
    wordsToCard([
      ...words,
      ...words.map((w) => ({
        ...w,
        bbox: { ...w.bbox, y0: w.bbox.y0 + 600, y1: w.bbox.y1 + 600 },
      })),
    ]),
  );
});

import { findGrid } from "../.test-build/card-grid.js";
function gridImage(header = false) {
  const width = 360,
    height = 420;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 30; y <= 390; y++)
    for (let x = 30; x <= 330; x++) {
      if ((x - 30) % 60 === 0 || (y - 30) % 60 === 0 || (header && y < 90)) {
        const i = (y * width + x) * 4;
        data[i] = 30;
        data[i + 1] = 60;
        data[i + 2] = 140;
      }
    }
  return { width, height, data };
}

test("finds printed grid without OCR, excluding header and outer margins", () => {
  for (const header of [false, true])
    assert.deepEqual(findGrid(gridImage(header)), {
      x: [30, 90, 150, 210, 270, 330],
      y: [90, 150, 210, 270, 330, 390],
    });
});

test("does not invent a grid on a blank image", () => {
  assert.equal(
    findGrid({
      width: 360,
      height: 420,
      data: new Uint8ClampedArray(360 * 420 * 4).fill(255),
    }),
    null,
  );
});
