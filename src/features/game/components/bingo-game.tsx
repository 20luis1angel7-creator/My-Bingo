"use client";

import { useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBingo } from "../use-bingo";
import { winningCells } from "../engine";
import { PlayingCard } from "./playing-card";
import { ManualCard } from "./manual-card";
import { CardScanner } from "./card-scanner";

export function BingoGame() {
  const { game, notice, toggle, restart } = useBingo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [manual, setManual] = useState(false);
  const [scanned, setScanned] = useState<string[]>([]);
  if (!game)
    return (
      <p role="status" className="py-20 text-center text-muted-foreground">
        Preparando tu cartón…
      </p>
    );
  const winners = winningCells(game);
  return (
    <div className="mx-auto max-w-xl">
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-amber-100 p-4 text-sm text-amber-950"
        >
          {notice}
        </p>
      )}
      <CardScanner
        onRead={(card) => {
          setScanned(card);
          setManual(true);
          setConfirmReset(false);
        }}
      />
      <Button
        className="mb-4 h-11 w-full"
        aria-expanded={manual}
        aria-controls="manual-card"
        onClick={() => {
          setScanned([]);
          setManual(!manual);
        }}
      >
        {manual ? "Cancelar ingreso manual" : "Ingresar cartón manual"}
      </Button>
      {manual && (
        <ManualCard
          key={JSON.stringify(scanned)}
          initialValues={scanned}
          onSave={(card) => {
            restart(card);
            setManual(false);
            setConfirmReset(false);
          }}
        />
      )}
      <PlayingCard game={game} winners={winners} onToggle={toggle} />
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 text-center"
      >
        {winners.length > 0 ? (
          <div className="rounded-2xl bg-amber-100 p-5 text-amber-950">
            <Trophy aria-hidden="true" className="mx-auto mb-2 size-7" />
            <h2 className="text-2xl font-extrabold">¡Bingo!</h2>
            <p className="mt-2 text-sm">
              Tus marcas completan una fila, columna o diagonal. Puedes seguir
              marcando o corregir un número.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {game.marked.length} de 24 números marcados · Centro libre
          </p>
        )}
      </div>
      <Button
        onClick={() => setConfirmReset(true)}
        variant="outline"
        className="mt-5 h-11 w-full"
        disabled={confirmReset}
      >
        <RotateCcw aria-hidden="true" /> Nueva partida
      </Button>
      {confirmReset && (
        <div
          className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
          role="group"
          aria-label="Confirmar nueva partida"
        >
          <p className="text-sm">
            Se reemplazarán el cartón y sus marcas. ¿Comenzar otra partida?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="h-11"
              onClick={() => {
                restart();
                setConfirmReset(false);
              }}
            >
              Sí, comenzar otra
            </Button>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => setConfirmReset(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        Las marcas se guardan en este navegador. Completa una fila, columna o
        diagonal para hacer bingo.
      </p>
    </div>
  );
}
