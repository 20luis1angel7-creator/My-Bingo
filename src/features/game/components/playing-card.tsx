import { Star, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { LETTERS, type Game } from "../engine";

export function PlayingCard({
  game,
  winners,
  onToggle,
  onRemove,
  id,
  label,
}: {
  id: string;
  label: string;
  onRemove: () => void;
  game: Game;
  winners: number[];
  onToggle: (number: number) => void;
}) {
  return (
    <section
      aria-labelledby={`card-title-${id}`}
      className="w-[280px] max-w-full rounded-2xl border bg-white p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={`card-title-${id}`} className="text-sm font-bold">
          {label}
        </h2>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Eliminar ${label.toLowerCase()}`}
          title={`Eliminar ${label.toLowerCase()}`}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div
        className="grid grid-cols-5 gap-1"
        role="group"
        aria-label={`Números de ${label.toLowerCase()}`}
      >
        {LETTERS.map((letter) => (
          <div
            key={letter}
            className="flex h-8 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white"
            aria-hidden="true"
          >
            {letter}
          </div>
        ))}
        {game.card.map((number, index) => {
          const marked = number === null || game.marked.includes(number);
          return (
            <button
              type="button"
              disabled={number === null}
              aria-pressed={marked}
              onClick={() => {
                if (number !== null) onToggle(number);
              }}
              key={index}
              aria-label={
                number === null
                  ? "Casilla libre, marcada"
                  : `${LETTERS[index % 5]} ${number}${marked ? ", marcado" : ", pendiente"}`
              }
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg border border-transparent bg-muted/60 text-lg font-bold",
                marked && "border-primary/30 bg-primary/15 text-primary",
                winners.includes(index) &&
                  "border-amber-400 bg-amber-100 text-amber-900",
              )}
            >
              {number === null ? (
                <Star aria-hidden="true" className="size-5 fill-current" />
              ) : (
                number
              )}
              {marked && number !== null && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 right-1 text-[10px] leading-none"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        role="status"
        aria-live="polite"
        className="mt-3 text-center text-xs"
      >
        {winners.length > 0 ? (
          <p className="flex items-center justify-center gap-1 rounded-lg bg-amber-100 p-2 font-bold text-amber-900">
            <Trophy aria-hidden="true" className="size-4" /> ¡Bingo!
          </p>
        ) : (
          <p className="text-muted-foreground">
            {game.marked.length}/24 marcados · Centro libre
          </p>
        )}
      </div>
    </section>
  );
}
