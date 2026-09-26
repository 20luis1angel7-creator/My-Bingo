import type { Worker } from "tesseract.js";
import { findGrid, type Grid } from "./card-grid";
import { findCardPanels, rectifyPhoto, type Quad } from "./card-photo";

type Word = {
  text: string;
  confidence?: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

// Use positions, not reading order, so an unread number leaves an empty cell.
function locateRows(words: Word[]): Word[][] {
  const numbers = words.filter(({ text }) =>
    /^(?:[1-9]|[1-6][0-9]|7[0-5])$/.test(text.trim()),
  );
  const rows: Word[][] = [];
  for (const word of numbers.sort((a, b) => a.bbox.y0 - b.bbox.y0)) {
    const center = (word.bbox.y0 + word.bbox.y1) / 2;
    const row = rows.find(
      ([first]) => center >= first.bbox.y0 && center <= first.bbox.y1,
    );
    if (row) row.push(word);
    else rows.push([word]);
  }
  // Fit five evenly spaced rows; an unread interior row must remain empty.
  const centers = rows.map(
    (row) =>
      row.reduce((sum, w) => sum + (w.bbox.y0 + w.bbox.y1) / 2, 0) / row.length,
  );
  let grid: Word[][] | null = null;
  let bestScore = 0;
  for (let first = 0; first < rows.length; first++)
    for (let last = first + 3; last < rows.length; last++) {
      const step = (centers[last] - centers[first]) / 4;
      if (step <= 0) continue;
      const candidate: Word[][] = Array.from({ length: 5 }, () => []);
      let outside = 0;
      rows.forEach((row, i) => {
        const position = (centers[i] - centers[first]) / step;
        const index = Math.round(position);
        if (index >= 0 && index < 5 && Math.abs(position - index) < 0.22)
          candidate[index].push(...row);
        else outside += row.length;
      });
      const score = candidate.flat().length;
      if (
        candidate.filter((r) => r.length).length >= 4 &&
        outside < 3 &&
        score >= 10 &&
        score > bestScore
      ) {
        grid = candidate;
        bestScore = score;
      }
    }
  if (!grid)
    throw new Error(
      "No pude localizar la cuadrícula. Recorta la imagen alrededor de un solo cartón e inténtalo de nuevo.",
    );
  return grid;
}

export function wordsToCard(words: Word[]): string[] {
  const grid = locateRows(words);
  const card = Array<string>(25).fill("");
  grid.forEach((row, r) => {
    for (let col = 0; col < 5; col++) {
      const matches = row.filter(
        (w) => Math.floor((Number(w.text) - 1) / 15) === col,
      );
      if (matches.length === 1 && r * 5 + col !== 12)
        card[r * 5 + col] = matches[0].text.trim();
    }
  });
  return card;
}

// With known borders, missing entire rows do not prevent locating other numbers.
export function wordsInGrid(words: Word[], grid: Grid): string[] {
  const cells: Word[][] = Array.from({ length: 25 }, () => []);
  for (const word of words) {
    const x = (word.bbox.x0 + word.bbox.x1) / 2;
    const y = (word.bbox.y0 + word.bbox.y1) / 2;
    const col = grid.x.findIndex(
      (left, i) => i < 5 && x > left && x < grid.x[i + 1],
    );
    const row = grid.y.findIndex(
      (top, i) => i < 5 && y > top && y < grid.y[i + 1],
    );
    if (col < 0 || row < 0) continue;
    if (/^\d{1,2}$/.test(word.text.trim())) cells[row * 5 + col].push(word);
  }
  return cells.map((words, i) => {
    if (i === 12 || words.length !== 1) return "";
    return chooseCellReading(
      words.map((w) => ({ text: w.text, confidence: w.confidence ?? 65 })),
      i % 5,
    );
  });
}

export function fillMissingCells(
  card: string[],
  supplement: string[],
): string[] {
  return card.map((value, i) => {
    if (i === 12) return "";
    const candidate = supplement[i];
    if (value || !candidate || card.includes(candidate)) return value;
    // Repeated numbers are not evidence of two different cells.
    if (supplement.indexOf(candidate) !== supplement.lastIndexOf(candidate))
      return "";
    return candidate;
  });
}

// Recover cell boundaries even when printed borders are absent or interrupted.
export function gridFromWords(words: Word[]): Grid {
  const rows = locateRows(words);
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const columns = Array.from({ length: 5 }, (_, col) =>
    rows.flat().filter((w) => Math.floor((Number(w.text) - 1) / 15) === col),
  );
  const xs = columns.map((column) =>
    column.length
      ? median(column.map((w) => (w.bbox.x0 + w.bbox.x1) / 2))
      : null,
  );
  const ys = rows.map((row) =>
    row.length ? median(row.map((w) => (w.bbox.y0 + w.bbox.y1) / 2)) : null,
  );
  function boundaries(centers: (number | null)[]) {
    const steps: number[] = [];
    centers.forEach((a, i) =>
      centers.forEach((b, j) => {
        if (a !== null && b !== null && j > i) steps.push((b - a) / (j - i));
      }),
    );
    if (!steps.length)
      throw new Error("No pude determinar las casillas del cartón.");
    const step = median(steps);
    const start = median(
      centers.flatMap((c, i) => (c === null ? [] : [c - i * step])),
    );
    if (
      step <= 0 ||
      centers.some(
        (c, i) => c !== null && Math.abs(c - start - i * step) > step * 0.22,
      )
    )
      throw new Error(
        "La posición de los números no corresponde a un solo cartón.",
      );
    return Array.from({ length: 6 }, (_, i) => start + (i - 0.5) * step);
  }
  return { x: boundaries(xs), y: boundaries(ys) };
}

export function chooseCellReading(
  readings: { text: string; confidence: number }[],
  col: number,
): string {
  const candidates = new Map<string, number[]>();
  for (const reading of readings) {
    const text = reading.text.replace(/\s/g, "");
    const number = Number(text);
    if (
      !/^\d{1,2}$/.test(text) ||
      number < col * 15 + 1 ||
      number > (col + 1) * 15 ||
      reading.confidence < 30
    )
      continue;
    const key = String(number);
    candidates.set(key, [...(candidates.get(key) ?? []), reading.confidence]);
  }
  const ranked = [...candidates]
    .map(([text, scores]) => ({
      text,
      score: Math.max(...scores),
      count: scores.length,
    }))
    .sort((a, b) => b.count - a.count || b.score - a.score);
  const best = ranked[0];
  if (!best || (best.score < 65 && best.count < 2)) return "";
  if (
    ranked[1] &&
    ranked[1].count === best.count &&
    best.score - ranked[1].score < 15
  )
    return "";
  return best.text;
}

// Local contrast compensates for shadows without washing out faint digits.
export function enhancePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const stride = width + 1;
  const sums = new Float64Array(stride * (height + 1));
  const gray = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      gray[i] = Math.round(
        data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114,
      );
      row += gray[i];
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
  const radius = Math.max(12, Math.round(Math.min(width, height) / 12));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - radius),
        x1 = Math.min(width, x + radius + 1);
      const y0 = Math.max(0, y - radius),
        y1 = Math.min(height, y + radius + 1);
      const mean =
        (sums[y1 * stride + x1] -
          sums[y0 * stride + x1] -
          sums[y1 * stride + x0] +
          sums[y0 * stride + x0]) /
        ((x1 - x0) * (y1 - y0));
      const i = (y * width + x) * 4;
      data[i] =
        data[i + 1] =
        data[i + 2] =
          gray[y * width + x] < mean - 10 ? 0 : 255;
    }
}

function enhanced(canvas: HTMLCanvasElement) {
  const result = document.createElement("canvas");
  result.width = canvas.width;
  result.height = canvas.height;
  const ctx = result.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0);
  const pixels = ctx.getImageData(0, 0, result.width, result.height);
  enhancePixels(pixels.data, result.width, result.height);
  ctx.putImageData(pixels, 0, 0);
  return result;
}

async function decodePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(2, 2200 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

async function prepareImage(file: File) {
  const canvas = await decodePhoto(file);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const grid = findGrid(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (grid) return { canvas, grid };
  // Straighten modest camera tilt before looking for cell borders again.
  const rotated = document.createElement("canvas");
  rotated.width = rotated.height = Math.ceil(
    Math.hypot(canvas.width, canvas.height),
  );
  const rotation = rotated.getContext("2d", { willReadFrequently: true })!;
  for (let degrees = 1; degrees <= 8; degrees++)
    for (const sign of [-1, 1]) {
      rotation.resetTransform();
      rotation.fillStyle = "white";
      rotation.fillRect(0, 0, rotated.width, rotated.height);
      rotation.translate(rotated.width / 2, rotated.height / 2);
      rotation.rotate((degrees * sign * Math.PI) / 180);
      rotation.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      const corrected = findGrid(
        rotation.getImageData(0, 0, rotated.width, rotated.height),
      );
      if (corrected) return { canvas: rotated, grid: corrected };
    }
  return { canvas, grid: null };
}

export async function readCells(
  worker: Worker,
  canvas: HTMLCanvasElement,
  grid: Grid,
  onProgress: (message: string) => void,
  seed: string[] = Array<string>(25).fill(""),
) {
  const { PSM } = await import("tesseract.js");
  const card = [...seed];
  const cell = document.createElement("canvas");
  cell.width = cell.height = 240;
  const ctx = cell.getContext("2d")!;
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
    tessedit_char_whitelist: "0123456789",
  });
  for (let i = 0; i < 25; i++) {
    if (i === 12 || card[i]) continue;
    const col = i % 5,
      row = Math.floor(i / 5);
    const width = grid.x[col + 1] - grid.x[col],
      height = grid.y[row + 1] - grid.y[row];
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 240, 240);
    // Remove borders and give isolated digits a white margin for recognition.
    const fit = 200 / Math.max(width, height);
    ctx.drawImage(
      canvas,
      grid.x[col] + width * 0.08,
      grid.y[row] + height * 0.08,
      width * 0.84,
      height * 0.84,
      (240 - width * fit) / 2,
      (240 - height * fit) / 2,
      width * fit,
      height * fit,
    );
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
    const readings = [(await worker.recognize(cell)).data];
    // Keep a valid original reading; alternate preprocessing must not erase it.
    let value = chooseCellReading(readings, col);
    if (!value) {
      readings.push((await worker.recognize(enhanced(cell))).data);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_WORD });
      readings.push((await worker.recognize(cell)).data);
      value = chooseCellReading(readings, col);
    }
    if (!value) {
      // The normal inset can clip wide digits. Retry with a narrower border crop.
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 240, 240);
      ctx.drawImage(
        canvas,
        grid.x[col] + width * 0.03,
        grid.y[row] + height * 0.03,
        width * 0.94,
        height * 0.94,
        (240 - width * fit) / 2,
        (240 - height * fit) / 2,
        width * fit,
        height * fit,
      );
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
      readings.push((await worker.recognize(cell)).data);
      value = chooseCellReading(readings, col);
    }
    if (!value) {
      // Large single digits (especially 4) can fail line segmentation. Re-read
      // at normal text sizes with segmentation intended for isolated glyphs.
      for (const size of [120, 180]) {
        const retry = document.createElement("canvas");
        retry.width = retry.height = size;
        retry.getContext("2d")!.drawImage(cell, 0, 0, size, size);
        await worker.setParameters({
          tessedit_pageseg_mode: size === 120 ? PSM.RAW_LINE : PSM.SINGLE_WORD,
        });
        readings.push((await worker.recognize(retry)).data);
        value = chooseCellReading(readings, col);
        if (value) break;
      }
    }
    if (value && !card.includes(value)) card[i] = value;
    onProgress(`Leyendo casilla ${i < 12 ? i + 1 : i} de 24…`);
  }
  return card;
}

// Separate orchestration from file decoding so the complete fallback path is testable.
export async function readCardImage(
  worker: Worker,
  canvas: HTMLCanvasElement,
  grid: Grid | null,
  onProgress: (message: string) => void = () => {},
): Promise<string[]> {
  const { PSM } = await import("tesseract.js");
  let card = Array<string>(25).fill("");
  if (grid) {
    onProgress("Leyendo los números del cartón enderezado…");
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: "0123456789",
    });
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const words = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)),
    );
    card = wordsInGrid(words, grid);
    card = await readCells(worker, canvas, grid, onProgress, card);
  }
  if (card.filter(Boolean).length === 24) return card;

  for (const mode of [PSM.SPARSE_TEXT, PSM.SINGLE_BLOCK]) {
    for (const contrast of [false, true]) {
      onProgress(
        `Recuperando números pendientes… ${card.filter(Boolean).length} de 24 leídos.`,
      );
      const source = contrast ? enhanced(canvas) : canvas;
      await worker.setParameters({
        tessedit_pageseg_mode: mode,
        tessedit_char_whitelist: "0123456789",
      });
      const { data } = await worker.recognize(source, {}, { blocks: true });
      const words = (data.blocks ?? []).flatMap((b) =>
        b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)),
      );
      if (grid) {
        card = fillMissingCells(card, wordsInGrid(words, grid));
      } else {
        let global: string[];
        try {
          global = wordsToCard(words);
        } catch {
          continue;
        }
        // Preserve full-image recognition even if estimating crop borders fails.
        card = fillMissingCells(card, global);
        try {
          grid = gridFromWords(words);
        } catch {
          // Another segmentation/contrast pass can still recover missing numbers.
        }
      }
      if (card.filter(Boolean).length === 24) return card;
      if (grid) card = await readCells(worker, canvas, grid, onProgress, card);
      if (card.filter(Boolean).length === 24) return card;
    }
  }
  if (card.some(Boolean)) return card;
  throw new Error(
    "No pude leer el cartón. Usa una foto de frente con las 25 casillas visibles y buena luz.",
  );
}

export async function scanCard(
  file: File,
  onProgress: (message: string) => void = () => {},
): Promise<string[]> {
  const { canvas, grid } = await prepareImage(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await new Promise<Worker>((resolve, reject) => {
    createWorker("eng", 1, { errorHandler: reject }).then(resolve, reject);
  });
  try {
    return await readCardImage(worker, canvas, grid, onProgress);
  } finally {
    await worker.terminate();
  }
}

export async function inspectCardPhoto(file: File) {
  const canvas = await decodePhoto(file);
  const pixels = canvas
    .getContext("2d")!
    .getImageData(0, 0, canvas.width, canvas.height);
  return {
    canvas,
    panels: findCardPanels(pixels),
    preview: canvas.toDataURL("image/jpeg", 0.85),
  };
}

export async function scanSelectedCard(
  source: HTMLCanvasElement,
  corners: Quad,
  onProgress: (message: string) => void = () => {},
): Promise<string[]> {
  onProgress("Enderezando el cartón seleccionado…");
  const pixels = source
    .getContext("2d")!
    .getImageData(0, 0, source.width, source.height);
  const corrected = rectifyPhoto(pixels, corners);
  const canvas = document.createElement("canvas");
  canvas.width = corrected.width;
  canvas.height = corrected.height;
  canvas
    .getContext("2d")!
    .putImageData(
      new ImageData(
        new Uint8ClampedArray(corrected.data),
        corrected.width,
        corrected.height,
      ),
      0,
      0,
    );
  const borders = Array.from({ length: 6 }, (_, i) => (i * canvas.width) / 5);
  const { createWorker } = await import("tesseract.js");
  onProgress(
    "Preparando el lector de números… La primera vez puede tardar unos segundos.",
  );
  const worker = await new Promise<Worker>((resolve, reject) => {
    createWorker("eng", 1, { errorHandler: reject }).then(resolve, reject);
  });
  try {
    return await readCardImage(
      worker,
      canvas,
      { x: borders, y: borders },
      onProgress,
    );
  } finally {
    await worker.terminate();
  }
}
