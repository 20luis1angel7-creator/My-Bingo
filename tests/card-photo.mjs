import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findCardPanels,
  project,
  rectifyPhoto,
  validQuad,
} from "../.test-build/card-photo.js";

function panelFixture(count = 1) {
  const width = 500,
    height = count === 1 ? 420 : 820;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  function fill(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        const offset = (yy * width + xx) * 4;
        data[offset] = data[offset + 1] = data[offset + 2] = color;
      }
  }
  fill(0, 0, width, height, 50);
  for (let card = 0; card < count; card++) {
    const top = 70 + card * 400;
    fill(65, top - 50, 370, 390, 200);
    fill(80, top - 40, 340, 370, 90);
    fill(100, top, 300, 300, 210);
    for (let i = 1; i < 5; i++) {
      fill(100 + i * 60, top, 1, 300, 120);
      fill(100, top + i * 60, 300, 1, 120);
    }
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++) {
        fill(115 + col * 60, top + 15 + row * 60, 10, 30, 20);
        fill(134 + col * 60, top + 15 + row * 60, 10, 30, 20);
      }
  }
  return { width, height, data };
}

test("detects one and two separate framed panels without relying on grid rules", () => {
  for (const count of [1, 2]) {
    const panels = findCardPanels(panelFixture(count));
    assert.equal(panels.length, count);
    panels.forEach((q, i) => {
      assert.ok(Math.abs(q[0].x - 100) < 4);
      assert.ok(Math.abs(q[0].y - (70 + i * 400)) < 4);
      assert.ok(Math.abs(q[2].x - 399) < 4);
    });
  }
});

test("rejects blank paper and invalid crossing corners", () => {
  const data = new Uint8ClampedArray(100 * 100 * 4).fill(255);
  assert.deepEqual(findCardPanels({ width: 100, height: 100, data }), []);
  assert.equal(
    validQuad([
      { x: 0, y: 0 },
      { x: 90, y: 90 },
      { x: 90, y: 0 },
      { x: 0, y: 90 },
    ]),
    false,
  );
});

test("homography maps corners exactly and rectifies perspective with pixel sampling", () => {
  const q = [
    { x: 20, y: 10 },
    { x: 85, y: 20 },
    { x: 95, y: 90 },
    { x: 10, y: 80 },
  ];
  for (const [i, u, v] of [
    [0, 0, 0],
    [1, 1, 0],
    [2, 1, 1],
    [3, 0, 1],
  ]) {
    const p = project(q, u, v);
    assert.ok(Math.abs(p.x - q[i].x) < 1e-6 && Math.abs(p.y - q[i].y) < 1e-6);
  }
  const data = new Uint8ClampedArray(100 * 100 * 4).fill(255);
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) {
      data[(y * 100 + x) * 4] = x;
      data[(y * 100 + x) * 4 + 1] = y;
    }
  const result = rectifyPhoto({ width: 100, height: 100, data }, q, 50);
  const center = project(q, 25.5 / 50, 25.5 / 50);
  assert.ok(Math.abs(result.data[(25 * 50 + 25) * 4] - center.x) <= 1);
  assert.ok(Math.abs(result.data[(25 * 50 + 25) * 4 + 1] - center.y) <= 1);
});
