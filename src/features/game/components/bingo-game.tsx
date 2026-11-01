"use client";

import { useState } from "react";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBingo } from "../use-bingo";
import { DEFAULT_WIN_MODES, winningCells } from "../engine";
import { PlayingCard } from "./playing-card";
import { ManualCard } from "./manual-card";
import { NumberBoard } from "./number-board";
import { CardScanner } from "./card-scanner";

export function BingoGame({ storageKey }: { storageKey?: string }) {
  const {
    collection,
    notice,
    toggle,
    add,
    remove,
    clearMarks,
    toggleAll,
    setWinModes,
  } = useBingo(storageKey);
  const [manual, setManual] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [scanned, setScanned] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  if (!collection)
    return (
      <p role="status" className="py-20 text-center text-muted-foreground">
        Preparando tus cartones…
      </p>
    );
  const winModes = collection.winModes ?? DEFAULT_WIN_MODES;
  return (
    <div>
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-amber-100 p-4 text-sm text-amber-950"
        >
          {notice}
        </p>
      )}
      <div className="mb-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <CardScanner
            onStatus={setMessage}
            onRead={(card) => {
              setScanned(card);
              setManual(true);
              setMessage("");
            }}
          />
          <Button
            className="h-11"
            aria-expanded={manual}
            aria-controls="manual-card"
            onClick={() => {
              setScanned([]);
              setManual(!manual);
            }}
          >
            <Plus aria-hidden="true" />{" "}
            {manual ? "Cancelar ingreso" : "Añadir cartón manual"}
          </Button>
          <Button
            className="h-11"
            variant="outline"
            onClick={() => {
              add();
              setMessage("Cartón aleatorio añadido.");
            }}
          >
            <Plus aria-hidden="true" /> Añadir aleatorio
          </Button>
        </div>
        {manual && (
          <div className="max-w-lg">
            <ManualCard
              key={JSON.stringify(scanned)}
              initialValues={scanned}
              onSave={(card) => {
                add(card);
                setManual(false);
                setScanned([]);
                setMessage("Cartón guardado. Ya puedes añadir otro.");
              }}
            />
          </div>
        )}
      </div>
      <NumberBoard collection={collection} onToggle={toggleAll} />
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-xl font-bold">
          Mis cartones{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({collection.cards.length})
          </span>
        </h2>

        <p className="text-xs text-muted-foreground">
          Pulsa un número para marcarlo o desmarcarlo.
        </p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={
            !collection.cards.some(({ game }) => game.marked.length > 0)
          }
          onClick={() => {
            clearMarks();
            setMessage("Se desmarcaron todos los cartones.");
          }}
        >
          <RotateCcw aria-hidden="true" /> Desmarcar todos
        </Button>
        <div
          className="relative"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOptionsOpen(false);
          }}
        >
          <Button
            type="button"
            variant="outline"
            aria-expanded={optionsOpen}
            aria-controls="win-options"
            onClick={() => setOptionsOpen((open) => !open)}
          >
            Opciones para ganar
            <ChevronDown
              aria-hidden="true"
              className={optionsOpen ? "rotate-180" : ""}
            />
          </Button>
          {optionsOpen && (
            <fieldset
              id="win-options"
              className="absolute left-0 top-full z-10 mt-2 w-60 rounded-xl border bg-background p-3 text-sm shadow-lg"
            >
              <legend className="px-1 font-semibold">
                Opciones para ganar
              </legend>
              <div className="flex flex-col gap-3">
                {(
                  [
                    ["straight", "Línea horizontal o vertical"],
                    ["diagonal", "Diagonal"],
                    ["corners", "Cuatro esquinas"],
                    ["full", "Cartón lleno"],
                  ] as const
                ).map(([mode, label]) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-emerald-600"
                      checked={winModes.includes(mode)}
                      onChange={(event) =>
                        setWinModes(
                          event.target.checked
                            ? [...winModes, mode]
                            : winModes.filter((value) => value !== mode),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
              {winModes.length === 0 && (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  Activa una opción para detectar bingo.
                </p>
              )}
            </fieldset>
          )}
        </div>
        <p role="status" className="min-w-0 text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      <div
        className="flex flex-wrap items-start gap-4"
        aria-label="Cartones registrados"
      >
        {collection.cards.map(({ id, game }, index) => (
          <PlayingCard
            key={id}
            id={id}
            label={`Cartón ${index + 1}`}
            game={game}
            winners={winningCells(game, winModes)}
            onToggle={(number) => toggle(id, number)}
            onRemove={() => {
              remove(id);
              setMessage(`Cartón ${index + 1} eliminado.`);
            }}
          />
        ))}
      </div>
      {collection.cards.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Todavía no tienes cartones. Sube una foto o añade uno con los botones
          de arriba.
        </p>
      )}
      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        Tus cartones, marcas y opciones para ganar se guardan en este navegador.
        Hay bingo al completar cualquiera de las opciones activadas. El centro
        es libre.
      </p>
    </div>
  );
}
