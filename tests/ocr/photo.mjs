import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, ImageData } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { findCardPanels, rectifyPhoto } from "../../.test-build/card-photo.js";
import { readCardImage } from "../../.test-build/scan-card.js";
// Synthetic fixtures reproduce the supplied cards, not the original photographs.
const root = fileURLToPath(new URL("../../", import.meta.url));
const output = path.join(root, ".test-build", "photos");
fs.mkdirSync(output, { recursive: true });
const cards = [
  [
    11,
    17,
    42,
    49,
    72,
    12,
    23,
    36,
    51,
    68,
    7,
    30,
    "",
    48,
    65,
    14,
    29,
    35,
    56,
    73,
    2,
    27,
    34,
    57,
    69,
  ],
  [
    9,
    18,
    32,
    53,
    66,
    4,
    21,
    34,
    50,
    63,
    14,
    30,
    "",
    58,
    67,
    11,
    28,
    35,
    49,
    68,
    3,
    17,
    38,
    51,
    71,
  ],
];
function render(count) {
  const photo = createCanvas(840, count === 2 ? 1050 : 560),
    ctx = photo.getContext("2d");
  ctx.fillStyle = "#4d3821";
  ctx.fillRect(0, 0, photo.width, photo.height);
  for (let n = 0; n < count; n++) {
    ctx.save();
    ctx.translate(210, 75 + n * 490);
    ctx.rotate(((n ? -3 : 2) * Math.PI) / 180);
    ctx.fillStyle = "#d2c6a6";
    ctx.fillRect(-40, -65, 455, 480);
    ctx.fillStyle = "#6e695d";
    ctx.fillRect(-20, -50, 410, 450);
    ctx.fillStyle = "#eee7cd";
    ctx.font = "bold 38px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 5; i++) ctx.fillText("BINGO"[i], 35 + i * 70, -24);
    const shade = ctx.createLinearGradient(0, 0, 350, 350);
    shade.addColorStop(0, "#c5b791");
    shade.addColorStop(1, "#e1d8bf");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 350, 350);
    ctx.strokeStyle = "#9e9278";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 70, 0);
      ctx.lineTo(i * 70, 350);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * 70);
      ctx.lineTo(350, i * 70);
      ctx.stroke();
    }
    ctx.fillStyle = "#25241c";
    ctx.font = "bold 46px Arial";
    for (let i = 0; i < 25; i++)
      ctx.fillText(
        i === 12 ? ".es" : String(cards[n][i]),
        (i % 5) * 70 + 35,
        Math.floor(i / 5) * 70 + 37,
      );
    ctx.fillStyle = "#eee7cd";
    ctx.font = "bold 18px Arial";
    ctx.fillText("www.bingo.es", 95, 369);
    ctx.restore();
  }
  return photo;
}
(async () => {
  global.document = { createElement: () => createCanvas(1, 1) };
  const worker = await createWorker("eng", 1, { cachePath: output });
  const wrapped = {
    setParameters: (...args) => worker.setParameters(...args),
    recognize: (image, ...args) =>
      worker.recognize(image.toBuffer("image/png"), ...args),
  };
  try {
    for (const count of [1, 2]) {
      const original = render(count);
      // Match browser decodePhoto: upscale small uploads before detecting panels.
      const source = createCanvas(original.width * 2, original.height * 2);
      source
        .getContext("2d")
        .drawImage(original, 0, 0, source.width, source.height);
      fs.writeFileSync(
        path.join(output, `${count}-cards.png`),
        source.toBuffer("image/png"),
      );
      const pixels = source
        .getContext("2d")
        .getImageData(0, 0, source.width, source.height);
      const panels = findCardPanels(pixels);
      console.log("panels", count, JSON.stringify(panels));
      assert.equal(panels.length, count);
      for (let i = 0; i < count; i++) {
        const warped = rectifyPhoto(pixels, panels[i]);
        const canvas = createCanvas(1200, 1200);
        canvas
          .getContext("2d")
          .putImageData(new ImageData(warped.data, 1200, 1200), 0, 0);
        const borders = [0, 240, 480, 720, 960, 1200];
        const result = await readCardImage(wrapped, canvas, {
          x: borders,
          y: borders,
        });
        console.log(
          "OCR",
          count,
          i,
          result,
          "recognized",
          result.filter(Boolean).length,
        );
        assert.deepEqual(result, cards[i].map(String));
      }
    }
  } finally {
    await worker.terminate();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
