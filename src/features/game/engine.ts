export const LETTERS = ["B", "I", "N", "G", "O"] as const;
export type Game = { version: 2; card: (number | null)[]; marked: number[] };
export const STORAGE_KEY = "bingo-web-game-v1";

export function shuffle(values: number[]): number[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGame(): Game {
  const columns = LETTERS.map((_, col) =>
    shuffle(Array.from({ length: 15 }, (_, i) => col * 15 + i + 1)).slice(0, 5),
  );
  return {
    version: 2,
    card: Array.from({ length: 25 }, (_, i) =>
      i === 12 ? null : columns[i % 5][Math.floor(i / 5)],
    ),
    marked: [],
  };
}

export const lines = [
  ...Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => row * 5 + col),
  ),
  ...Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: 5 }, (_, row) => row * 5 + col),
  ),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export function winningCells(game: Game): number[] {
  return [
    ...new Set(
      lines
        .filter((line) =>
          line.every(
            (i) => game.card[i] === null || game.marked.includes(game.card[i]!),
          ),
        )
        .flat(),
    ),
  ];
}

export function toggleNumber(game: Game, number: number): Game {
  if (!game.card.includes(number)) return game;
  return {
    ...game,
    marked: game.marked.includes(number)
      ? game.marked.filter((n) => n !== number)
      : [...game.marked, number],
  };
}

// Preserve existing cards when migrating the previous automatic marking format.
export function restoreGame(value: unknown): Game | null {
  if (isGame(value)) return value;
  if (!value || typeof value !== "object") return null;
  const legacy = value as {
    version?: number;
    card?: (number | null)[];
    drawn?: number[];
  };
  if (
    legacy.version !== 1 ||
    !Array.isArray(legacy.card) ||
    !Array.isArray(legacy.drawn)
  )
    return null;
  const migrated = {
    version: 2,
    card: legacy.card,
    marked: [...new Set(legacy.drawn.filter((n) => legacy.card!.includes(n)))],
  };
  return isGame(migrated) ? migrated : null;
}

export function isGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const game = value as Game;
  if (
    game.version !== 2 ||
    !Array.isArray(game.card) ||
    game.card.length !== 25 ||
    game.card[12] !== null ||
    !Array.isArray(game.marked)
  )
    return false;
  const numbers = game.card.filter((n) => n !== null);
  return (
    numbers.length === 24 &&
    new Set(numbers).size === 24 &&
    game.card.every(
      (n, i) =>
        i === 12 ||
        (Number.isInteger(n) &&
          n! >= (i % 5) * 15 + 1 &&
          n! <= ((i % 5) + 1) * 15),
    ) &&
    game.marked.length <= 24 &&
    new Set(game.marked).size === game.marked.length &&
    game.marked.every((n) => Number.isInteger(n) && game.card.includes(n))
  );
}
