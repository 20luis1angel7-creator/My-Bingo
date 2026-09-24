import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LETTERS, type Game } from "../engine";

export function PlayingCard({
  game,
  winners,
  onToggle,
}: {
  game: Game;
  winners: number[];
  onToggle: (number: number) => void;
}) {
  return (
    <section
      aria-labelledby="card-title"
      className="rounded-3xl border bg-white p-4 shadow-sm sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="card-title" className="text-xl font-bold">
          Tu cartón de la suerte
        </h2>
        <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          75 bolas
        </span>
      </div>
      <div
        className="grid grid-cols-5 gap-2"
        role="group"
        aria-label="Cartón de bingo"
      >
        {LETTERS.map((letter) => (
          <div
            key={letter}
            className="flex h-12 items-center justify-center rounded-xl bg-primary text-xl font-extrabold text-white"
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
                "relative flex aspect-square items-center justify-center rounded-xl border border-transparent bg-muted/60 text-xl font-bold sm:text-2xl",
                marked && "border-primary/30 bg-primary/15 text-primary",
                winners.includes(index) &&
                  "border-amber-400 bg-amber-100 text-amber-900",
              )}
            >
              {number === null ? (
                <Star aria-hidden="true" className="size-6 fill-current" />
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
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Pulsa un número para marcarlo. Pulsa otra vez para desmarcarlo. La
        estrella siempre está marcada.
      </p>
    </section>
  );
}
