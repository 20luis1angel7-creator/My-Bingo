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

import {
  gridFromWords,
  chooseCellReading,
  enhancePixels,
} from "../.test-build/scan-card.js";

test("recovers borderless cells including missing interior rows and columns", () => {
  const grid = gridFromWords(
    words.filter((w) => w.bbox.y0 !== 200 && w.bbox.x0 !== 100),
  );
  assert.deepEqual(grid.x, [-30, 70, 170, 270, 370, 470]);
  assert.deepEqual(grid.y, [-30, 70, 170, 270, 370, 470]);
});

test("rejects inconsistent column positions instead of cropping the wrong cells", () => {
  assert.throws(() =>
    gridFromWords(
      words.map((w) => ({
        ...w,
        bbox: {
          ...w.bbox,
          x0: w.bbox.x0 === 200 ? 800 : w.bbox.x0,
          x1: w.bbox.x0 === 200 ? 840 : w.bbox.x1,
        },
      })),
    ),
  );
});

test("accepts repeated lower confidence readings but leaves conflicting digits blank", () => {
  const reading = (text, confidence) => ({ text, confidence });
  assert.equal(chooseCellReading([reading("1 7", 90)], 1), "17");
  assert.equal(
    chooseCellReading([reading("17", 50), reading("17", 55)], 1),
    "17",
  );
  assert.equal(chooseCellReading([reading("17", 50)], 1), "");
  assert.equal(
    chooseCellReading([reading("17", 90), reading("18", 88)], 1),
    "",
  );
  assert.equal(chooseCellReading([reading("77", 99)], 4), "");
  assert.equal(chooseCellReading([reading("17", 99)], 0), "");
});

test("enhances dark digits against a shaded background", () => {
  const width = 80,
    height = 80;
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const value = x >= 38 && x <= 42 && y > 20 && y < 60 ? 50 : 140 + x;
      const i = (y * width + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    }
  enhancePixels(pixels, width, height);
  assert.equal(pixels[(40 * width + 40) * 4], 0);
  assert.equal(pixels[(40 * width + 15) * 4], 255);
});

test("detects grid borders with small breaks from compression or faded ink", () => {
  const image = gridImage();
  for (let y = 30; y < 390; y++)
    for (let x = 30; x < 330; x++) {
      if (x % 17 === 0 || y % 17 === 0) {
        const i = (y * image.width + x) * 4;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      }
    }
  assert.deepEqual(findGrid(image), {
    x: [30, 90, 150, 210, 270, 330],
    y: [90, 150, 210, 270, 330, 390],
  });
});

import {
  readCardImage,
  wordsInGrid,
  fillMissingCells,
} from "../.test-build/scan-card.js";

const cellGrid = {
  x: [-30, 70, 170, 270, 370, 470],
  y: [-30, 70, 170, 270, 370, 470],
};
const expectedCard = wordsToCard(words);
function fakeCanvas() {
  return {
    width: 500,
    height: 500,
    getContext: () => ({
      fillRect() {},
      drawImage() {},
      putImageData() {},
      getImageData: () => ({
        data: new Uint8ClampedArray(240 * 240 * 4).fill(255),
      }),
    }),
  };
}
function ocrResult(text = "", confidence = 0, found = []) {
  return {
    data: {
      text,
      confidence,
      blocks: [{ paragraphs: [{ lines: [{ words: found }] }] }],
    },
  };
}

test("known borders recover isolated words even when most rows cannot be read", () => {
  const result = wordsInGrid([words[0], words[20]], cellGrid);
  assert.equal(result[0], words[0].text);
  assert.equal(result.filter(Boolean).length, 2);
});

test("supplemental passes preserve existing numbers and reject duplicate additions", () => {
  const partial = [...expectedCard];
  partial[0] = "";
  assert.deepEqual(fillMissingCells(partial, expectedCard), expectedCard);
  const conflicting = [...expectedCard];
  conflicting[1] = "17";
  assert.deepEqual(fillMissingCells(expectedCard, conflicting), expectedCard);
});

test("full-image OCR is retained without requiring successful cell crops", async () => {
  let calls = 0;
  const worker = {
    async setParameters() {},
    async recognize() {
      calls++;
      return ocrResult("", 0, words);
    },
  };
  assert.deepEqual(
    await readCardImage(worker, fakeCanvas(), null),
    expectedCard,
  );
  assert.equal(calls, 1);
});

test("partial grid reading continues to full-image OCR and fills the missing number", async (t) => {
  const originalDocument = globalThis.document;
  globalThis.document = { createElement: fakeCanvas };
  t.after(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  const source = fakeCanvas();
  let cellCalls = 0,
    fullCalls = 0;
  const worker = {
    async setParameters() {},
    async recognize(image) {
      if (image === source) {
        fullCalls++;
        return ocrResult("", 0, fullCalls === 1 ? [] : [words[0]]);
      }
      cellCalls++;
      // Six failed attempts on the first cell; all others are readable.
      if (cellCalls <= 6) return ocrResult();
      return ocrResult(words[cellCalls - 6].text, 75);
    },
  };
  assert.deepEqual(await readCardImage(worker, source, cellGrid), expectedCard);
  assert.equal(fullCalls, 2);
  assert.equal(cellCalls, 29);
});
