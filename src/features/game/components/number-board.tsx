"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LETTERS, numberMarkState, type CardCollection } from "../engine";

export function NumberBoard({
  collection,
  onToggle,
}: {
  collection: CardCollection;
  onToggle: (number: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      aria-labelledby="number-board-title"
      className="mb-6 rounded-2xl border bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="number-board-title" className="text-xl font-bold">
          Marcar por número
        </h2>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0"
          aria-expanded={expanded}
          aria-controls="number-board-content"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? (
            <ChevronUp aria-hidden="true" />
          ) : (
            <ChevronDown aria-hidden="true" />
          )}
          {expanded ? "Ocultar" : "Mostrar"}
        </Button>
      </div>
      <div id="number-board-content" hidden={!expanded}>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Pulsa un número para marcarlo en todos tus cartones. Pulsa de nuevo
          para desmarcarlo. Una raya indica que está marcado solo en algunos
          cartones; al pulsarlo se marcará en todos. Los números desactivados no
          aparecen en tus cartones.
        </p>
        <div className="grid grid-cols-5 gap-1.5 sm:block sm:space-y-3">
          {LETTERS.map((letter, column) => (
            <div
              key={letter}
              role="group"
              aria-label={`Números de la ${letter}`}
              className="flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-start"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary font-extrabold text-white">
                {letter}
              </span>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                {Array.from(
                  { length: 15 },
                  (_, index) => column * 15 + index + 1,
                ).map((number) => {
                  const { count, pressed } = numberMarkState(
                    collection,
                    number,
                  );
                  return (
                    <button
                      key={number}
                      type="button"
                      disabled={count === 0}
                      aria-pressed={pressed}
                      aria-label={`${letter} ${number}`}
                      onClick={() => onToggle(number)}
                      className={cn(
                        "relative flex size-11 items-center justify-center rounded-lg border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-30",
                        pressed === true
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-muted/60 enabled:hover:bg-primary/10",
                        pressed === "mixed" &&
                          "border-primary bg-primary/15 text-primary",
                      )}
                    >
                      {number}
                      {pressed !== false && (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-0.5 right-1 text-[10px]"
                        >
                          {pressed === true ? "✓" : "−"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
