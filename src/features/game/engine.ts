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

export type WinMode = "corners" | "full" | "straight" | "diagonal";
export const DEFAULT_WIN_MODES: WinMode[] = ["straight", "diagonal"];

export function winningCells(game: Game, modes?: WinMode[]): number[] {
  const patterns = modes
    ? modes.flatMap((mode) => {
        if (mode === "straight") return lines.slice(0, 10);
        if (mode === "diagonal") return lines.slice(10);
        if (mode === "corners") return [[0, 4, 20, 24]];
        return [Array.from({ length: 25 }, (_, i) => i)];
      })
    : lines;
  return [
    ...new Set(
      patterns
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

export type SavedCard = { id: string; game: Game };
export type CardCollection = {
  version: 3;
  cards: SavedCard[];
  winModes?: WinMode[];
  winModesVersion?: 1;
};

export function restoreCollection(value: unknown): CardCollection | null {
  if (
    value &&
    typeof value === "object" &&
    "version" in value &&
    value.version === 3
  ) {
    const collection = value as CardCollection;
    if (!Array.isArray(collection.cards)) return null;
    if (
      collection.winModes !== undefined &&
      (!Array.isArray(collection.winModes) ||
        collection.winModes.some(
          (mode) => !["corners", "full", "straight", "diagonal"].includes(mode),
        ))
    )
      return null;
    const ids = new Set<string>();
    for (const entry of collection.cards) {
      if (
        !entry ||
        typeof entry.id !== "string" ||
        !entry.id.trim() ||
        ids.has(entry.id) ||
        !isGame(entry.game)
      )
        return null;
      ids.add(entry.id);
    }
    return collection;
  }
  const game = restoreGame(value);
  return game ? { version: 3, cards: [{ id: "saved-card", game }] } : null;
}

export function addCard(
  collection: CardCollection,
  game: Game,
  id: string,
): CardCollection {
  if (
    !id.trim() ||
    collection.cards.some((card) => card.id === id) ||
    !isGame(game)
  )
    return collection;
  return { ...collection, cards: [...collection.cards, { id, game }] };
}

export function removeCard(
  collection: CardCollection,
  id: string,
): CardCollection {
  return {
    ...collection,
    cards: collection.cards.filter((card) => card.id !== id),
  };
}

export function toggleCardNumber(
  collection: CardCollection,
  id: string,
  number: number,
): CardCollection {
  return {
    ...collection,
    cards: collection.cards.map((card) =>
      card.id === id
        ? { ...card, game: toggleNumber(card.game, number) }
        : card,
    ),
  };
}

export function numberMarkState(collection: CardCollection, number: number) {
  const matching = collection.cards.filter(({ game }) =>
    game.card.includes(number),
  );
  const marked = matching.filter(({ game }) =>
    game.marked.includes(number),
  ).length;
  return {
    count: matching.length,
    pressed: marked === 0 ? false : marked === matching.length ? true : "mixed",
  } as const;
}

export function toggleAllCardNumber(
  collection: CardCollection,
  number: number,
): CardCollection {
  const { count, pressed } = numberMarkState(collection, number);
  if (!count) return collection;
  return {
    ...collection,
    cards: collection.cards.map((card) => {
      if (!card.game.card.includes(number)) return card;
      const marked = card.game.marked.filter((n) => n !== number);
      if (pressed !== true) marked.push(number);
      return { ...card, game: { ...card.game, marked } };
    }),
  };
}
