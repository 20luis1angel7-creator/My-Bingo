import { cn } from "@/lib/utils";
import { LETTERS, numberMarkState, type CardCollection } from "../engine";

export function NumberBoard({
  collection,
  onToggle,
}: {
  collection: CardCollection;
  onToggle: (number: number) => void;
}) {
  return (
    <section
      aria-labelledby="number-board-title"
      className="mb-6 rounded-2xl border bg-white p-4 shadow-sm"
    >
      <h2 id="number-board-title" className="text-xl font-bold">
        Marcar por número
      </h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Pulsa un número para marcarlo en todos tus cartones. Pulsa de nuevo para
        desmarcarlo. Una raya indica que está marcado solo en algunos cartones;
        al pulsarlo se marcará en todos. Los números desactivados no aparecen en
        tus cartones.
      </p>
      <div className="space-y-3">
        {LETTERS.map((letter, column) => (
          <div
            key={letter}
            role="group"
            aria-label={`Números de la ${letter}`}
            className="flex items-start gap-3"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary font-extrabold text-white">
              {letter}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                { length: 15 },
                (_, index) => column * 15 + index + 1,
              ).map((number) => {
                const { count, pressed } = numberMarkState(collection, number);
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
    </section>
  );
}
