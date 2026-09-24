export type Grid = { x: number[]; y: number[] };
type Pixels = { width: number; height: number; data: Uint8ClampedArray };

// Locate printed cell borders independently of whether OCR can read the numbers.
export function findGrid({ width, height, data }: Pixels): Grid | null {
  function axis(vertical: boolean) {
    const size = vertical ? width : height;
    const length = vertical ? height : width;
    const bands: number[][] = [];
    for (let a = 0; a < size; a++) {
      let run = 0,
        longest = 0;
      for (let b = 0; b < length; b++) {
        const i = (vertical ? b * width + a : a * width + b) * 4;
        const dark =
          Math.min(data[i], data[i + 1], data[i + 2]) < 180 &&
          data[i + 3] > 128;
        run = dark ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      if (longest < length * 0.3) continue;
      const last = bands.at(-1);
      if (last && a <= last[1] + 2) last[1] = a;
      else bands.push([a, a]);
    }
    const positions = bands.flatMap(([start, end]) =>
      end - start > 8 ? [start, end] : [(start + end) / 2],
    );
    let best: number[] = [];
    let bestStep = 0;
    for (const start of positions)
      for (const end of positions) {
        const step = (end - start) / 5;
        if (step < size / 15 || step < bestStep - 2) continue;
        const lines = Array.from({ length: 6 }, (_, i) =>
          positions.find(
            (p) => Math.abs(p - start - step * i) < Math.max(3, step * 0.05),
          ),
        );
        if (lines.every((p) => p !== undefined)) {
          best = lines as number[];
          bestStep = step;
        }
      }
    return best;
  }
  const x = axis(true),
    y = axis(false);
  return x.length === 6 && y.length === 6 ? { x, y } : null;
}
