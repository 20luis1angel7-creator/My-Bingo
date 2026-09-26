export type Point = { x: number; y: number };
// Clockwise: top left, top right, bottom right, bottom left, in image pixels.
export type Quad = [Point, Point, Point, Point];
export type Pixels = { width: number; height: number; data: Uint8ClampedArray };

export function validQuad(q: Quad): boolean {
  return q.every((p, i) => {
    const b = q[(i + 1) % 4],
      c = q[(i + 2) % 4];
    return (
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      (b.x - p.x) * (c.y - b.y) - (b.y - p.y) * (c.x - b.x) > 16
    );
  });
}

// Map the unit square to a photographed quadrilateral using a homography.
export function project(q: Quad, u: number, v: number): Point {
  const [a, b, c, d] = q;
  const dx = a.x - b.x + c.x - d.x,
    dy = a.y - b.y + c.y - d.y;
  const bx = b.x - c.x,
    by = b.y - c.y,
    cx = d.x - c.x,
    cy = d.y - c.y;
  const determinant = bx * cy - cx * by;
  const g = (dx * cy - cx * dy) / determinant;
  const h = (bx * dy - dx * by) / determinant;
  const denominator = g * u + h * v + 1;
  return {
    x:
      ((b.x - a.x + g * b.x) * u + (d.x - a.x + h * d.x) * v + a.x) /
      denominator,
    y:
      ((b.y - a.y + g * b.y) * u + (d.y - a.y + h * d.y) * v + a.y) /
      denominator,
  };
}

export function rectifyPhoto(source: Pixels, q: Quad, size = 1200): Pixels {
  if (!validQuad(q))
    throw new Error("Marca las cuatro esquinas de la cuadrícula en orden.");
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const point = project(q, (x + 0.5) / size, (y + 0.5) / size);
      const sx = Math.max(0, Math.min(source.width - 1, point.x));
      const sy = Math.max(0, Math.min(source.height - 1, point.y));
      const x0 = Math.floor(sx),
        y0 = Math.floor(sy);
      const x1 = Math.min(x0 + 1, source.width - 1),
        y1 = Math.min(y0 + 1, source.height - 1);
      const fx = sx - x0,
        fy = sy - y0,
        out = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const at = (px: number, py: number) =>
          source.data[(py * source.width + px) * 4 + channel];
        data[out + channel] =
          at(x0, y0) * (1 - fx) * (1 - fy) +
          at(x1, y0) * fx * (1 - fy) +
          at(x0, y1) * (1 - fx) * fy +
          at(x1, y1) * fx * fy;
      }
      data[out + 3] = 255;
    }
  return { width: size, height: size, data };
}

// Bright number panels surrounded by a dark frame (including multiple cards).
// Closing thin printed rules joins the 25 cells without depending on OCR.
export function findCardPanels(source: Pixels): Quad[] {
  const scale = Math.min(1, 600 / Math.max(source.width, source.height));
  const width = Math.round(source.width * scale),
    height = Math.round(source.height * scale);
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i =
        (Math.min(source.height - 1, Math.floor(y / scale)) * source.width +
          Math.min(source.width - 1, Math.floor(x / scale))) *
        4;
      const value = Math.round(
        source.data[i] * 0.299 +
          source.data[i + 1] * 0.587 +
          source.data[i + 2] * 0.114,
      );
      gray[y * width + x] = value;
      histogram[value]++;
    }
  let total = 0;
  for (let i = 0; i < 256; i++) total += i * histogram[i];
  let count = 0,
    sum = 0,
    bestVariance = 0,
    threshold = 128;
  for (let i = 0; i < 255; i++) {
    count += histogram[i];
    sum += i * histogram[i];
    if (!count || count === gray.length) continue;
    const diff = sum / count - (total - sum) / (gray.length - count);
    const variance = count * (gray.length - count) * diff * diff;
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = i;
    }
  }
  const candidates: { quad: Quad; area: number; score: number }[] = [];
  for (const cutoff of [threshold, threshold + 20, threshold - 20]) {
    const mask = Uint8Array.from(gray, (value) => (value > cutoff ? 1 : 0));
    const dilated = new Uint8Array(mask.length),
      closed = new Uint8Array(mask.length);
    for (let y = 2; y < height - 2; y++)
      for (let x = 2; x < width - 2; x++) {
        let on = 0;
        for (let dy = -2; dy <= 2 && !on; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (mask[(y + dy) * width + x + dx]) {
              on = 1;
              break;
            }
        dilated[y * width + x] = on;
      }
    for (let y = 4; y < height - 4; y++)
      for (let x = 4; x < width - 4; x++) {
        let on = 1;
        for (let dy = -2; dy <= 2 && on; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (!dilated[(y + dy) * width + x + dx]) {
              on = 0;
              break;
            }
        closed[y * width + x] = on;
      }
    const queue = new Int32Array(mask.length);
    for (let origin = 0; origin < closed.length; origin++) {
      if (!closed[origin]) continue;
      let head = 0,
        tail = 1;
      queue[0] = origin;
      closed[origin] = 0;
      const extremes = [Infinity, -Infinity, -Infinity, Infinity];
      const quad = Array.from({ length: 4 }, () => ({ x: 0, y: 0 })) as Quad;
      while (head < tail) {
        const index = queue[head++],
          x = index % width,
          y = Math.floor(index / width);
        const measures = [x + y, x - y, x + y, x - y];
        measures.forEach((m, k) => {
          if (k === 0 || k === 3 ? m < extremes[k] : m > extremes[k]) {
            extremes[k] = m;
            quad[k] = { x, y };
          }
        });
        for (const neighbor of [
          index - 1,
          index + 1,
          index - width,
          index + width,
        ]) {
          if (neighbor >= 0 && neighbor < closed.length && closed[neighbor]) {
            closed[neighbor] = 0;
            queue[tail++] = neighbor;
          }
        }
      }
      if (tail < width * height * 0.015 || !validQuad(quad)) continue;
      const area =
        Math.abs(
          quad.reduce((acc, p, i) => {
            const next = quad[(i + 1) % 4];
            return acc + p.x * next.y - p.y * next.x;
          }, 0),
        ) / 2;
      const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
      const ratio =
        (distance(quad[0], quad[1]) + distance(quad[2], quad[3])) /
        (distance(quad[1], quad[2]) + distance(quad[3], quad[0]));
      if (tail / area < 0.65 || ratio < 0.68 || ratio > 1.45) continue;
      // A grid has ink inside almost every cell; plain paper does not.
      let printedCells = 0;
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 5; col++) {
          if (row === 2 && col === 2) continue;
          let dark = 0;
          for (let yy = 0; yy < 10; yy++)
            for (let xx = 0; xx < 10; xx++) {
              const p = project(
                quad,
                (col + 0.2 + xx * 0.06) / 5,
                (row + 0.2 + yy * 0.06) / 5,
              );
              if (gray[Math.round(p.y) * width + Math.round(p.x)] < cutoff)
                dark++;
            }
          if (dark >= 4 && dark <= 70) printedCells++;
        }
      if (printedCells < 19) continue;
      candidates.push({
        quad: quad.map((p) => ({ x: p.x / scale, y: p.y / scale })) as Quad,
        area: area / (scale * scale),
        score: printedCells,
      });
    }
  }
  const panels: Quad[] = [];
  for (const candidate of candidates.sort(
    (a, b) => b.score - a.score || b.area - a.area,
  )) {
    const center = project(candidate.quad, 0.5, 0.5);
    if (
      panels.some((q) => {
        const c = project(q, 0.5, 0.5);
        return (
          Math.hypot(c.x - center.x, c.y - center.y) <
          Math.sqrt(candidate.area) * 0.4
        );
      })
    )
      continue;
    panels.push(candidate.quad);
  }
  return panels.sort((a, b) => a[0].y - b[0].y || a[0].x - b[0].x);
}
