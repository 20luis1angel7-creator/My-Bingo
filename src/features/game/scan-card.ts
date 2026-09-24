import type { Worker } from "tesseract.js";
import { findGrid, type Grid } from "./card-grid";

type Word = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

// Use positions, not reading order, so an unread number leaves an empty cell.
export function wordsToCard(words: Word[]): string[] {
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

async function prepareImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = 1400 / Math.max(bitmap.width, bitmap.height);
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
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

async function readCells(
  worker: Worker,
  canvas: HTMLCanvasElement,
  grid: Grid,
  onProgress: (message: string) => void,
) {
  const { PSM } = await import("tesseract.js");
  const card = Array<string>(25).fill("");
  const cell = document.createElement("canvas");
  cell.width = cell.height = 240;
  const ctx = cell.getContext("2d")!;
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
    tessedit_char_whitelist: "0123456789",
  });
  for (let i = 0; i < 25; i++) {
    if (i === 12) continue;
    const col = i % 5,
      row = Math.floor(i / 5);
    const width = grid.x[col + 1] - grid.x[col],
      height = grid.y[row + 1] - grid.y[row];
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 240, 240);
    // Remove borders and give isolated digits a white margin for recognition.
    ctx.drawImage(
      canvas,
      grid.x[col] + width * 0.08,
      grid.y[row] + height * 0.08,
      width * 0.84,
      height * 0.84,
      20,
      20,
      200,
      200,
    );
    let { data } = await worker.recognize(cell);
    let text = data.text.trim();
    if (
      data.confidence < 65 ||
      !/^\d{1,2}$/.test(text) ||
      Number(text) < col * 15 + 1 ||
      Number(text) > (col + 1) * 15
    ) {
      const retry = document.createElement("canvas");
      retry.width = retry.height = 180;
      retry.getContext("2d")!.drawImage(cell, 0, 0, 180, 180);
      ({ data } = await worker.recognize(retry));
      text = data.text.trim();
    }
    if (
      data.confidence >= 65 &&
      /^\d{1,2}$/.test(text) &&
      Number(text) >= col * 15 + 1 &&
      Number(text) <= (col + 1) * 15
    )
      card[i] = String(Number(text));
    onProgress(`Leyendo casilla ${i < 12 ? i + 1 : i} de 24…`);
  }
  return card;
}

export async function scanCard(
  file: File,
  onProgress: (message: string) => void = () => {},
): Promise<string[]> {
  const { canvas, grid } = await prepareImage(file);
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await new Promise<Worker>((resolve, reject) => {
    createWorker("eng", 1, { errorHandler: reject }).then(resolve, reject);
  });
  try {
    if (grid) {
      const card = await readCells(worker, canvas, grid, onProgress);
      if (!card.some(Boolean))
        throw new Error(
          "Localicé las casillas, pero no pude leer sus números con suficiente confianza. Prueba otra imagen o ingresa el cartón manualmente.",
        );
      return card;
    }
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const { data } = await worker.recognize(
      canvas,
      { rotateAuto: true },
      { blocks: true },
    );
    const words = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)),
    );
    return wordsToCard(words);
  } finally {
    await worker.terminate();
  }
}
