import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isGame, LETTERS, type Game } from "../engine";

export function ManualCard({
  onSave,
  initialValues = [],
}: {
  onSave: (game: Game) => void;
  initialValues?: string[];
}) {
  const [error, setError] = useState("");
  return (
    <form
      id="manual-card"
      aria-label="Ingresar cartón manual"
      className="mb-5 rounded-3xl border bg-white p-4 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const game: Game = {
          version: 2,
          card: Array.from({ length: 25 }, (_, i) =>
            i === 12 ? null : Number(data.get(String(i))),
          ),
          marked: [],
        };
        if (!isGame(game)) {
          setError(
            "Completa todas las casillas con números válidos y sin repetir.",
          );
          return;
        }
        onSave(game);
      }}
    >
      <p id="manual-help" className="mb-4 text-sm text-muted-foreground">
        Copia o revisa los números de tu cartón. El centro es libre. Al guardar
        se añadirá a tus cartones.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {LETTERS.map((letter, col) => (
          <div
            key={letter}
            className="rounded-lg bg-primary py-2 text-center font-bold text-white"
          >
            {letter}
            <span className="block text-xs font-normal">
              {col * 15 + 1}–{(col + 1) * 15}
            </span>
          </div>
        ))}
        {Array.from({ length: 25 }, (_, i) =>
          i === 12 ? (
            <span
              key={i}
              className="flex aspect-square items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
            >
              Libre
            </span>
          ) : (
            <input
              key={i}
              name={String(i)}
              defaultValue={initialValues[i] ?? ""}
              type="number"
              inputMode="numeric"
              required
              min={(i % 5) * 15 + 1}
              max={((i % 5) + 1) * 15}
              step={1}
              aria-label={`${LETTERS[i % 5]}, fila ${Math.floor(i / 5) + 1}`}
              aria-describedby="manual-help"
              className="aspect-square w-full min-w-0 rounded-lg border text-center text-lg font-bold focus-visible:outline-2 focus-visible:outline-primary"
            />
          ),
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4 h-11 w-full">
        Guardar cartón
      </Button>
    </form>
  );
}
