import Link from "next/link";
import {
  ArrowRight,
  ScanLine,
  Sparkles,
  Smartphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BingoCardPreview } from "@/components/home/bingo-card-preview";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="page-container grid items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-24 lg:pt-20"
    >
      <div>
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary">
          <Sparkles aria-hidden="true" className="size-3.5 shrink-0" /> El bingo
          de siempre. Una nueva forma de jugar.
        </p>
        <h1
          id="hero-title"
          className="max-w-xl text-[clamp(2.8rem,5.5vw,4.5rem)] leading-[1.08] font-extrabold tracking-[-0.055em]"
        >
          Tu bingo, ahora
          <br className="hidden sm:block" /> en tu{" "}
          <span className="relative inline-block text-primary">
            bolsillo
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-0 h-2 w-full -rotate-2 rounded-full bg-amber-300/75"
            />
          </span>
        </h1>
        <p className="mt-7 max-w-[29rem] text-base leading-7 text-muted-foreground sm:text-lg">
          Disfruta de una partida de bingo con tu propio cartón, marcado manual.
          Sencillo, rápido y desde cualquier dispositivo.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/jugar"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/15 hover:bg-primary/90"
          >
            Comenzar <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled
            className="h-12 bg-white px-6"
          >
            <ScanLine aria-hidden="true" /> Escanear · Próximamente
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Smartphone aria-hidden="true" className="size-3.5" /> Siempre
            contigo
          </span>
          <span className="flex items-center gap-1.5">
            <Check aria-hidden="true" className="size-3.5 text-primary" /> Fácil
            de usar
          </span>
        </div>
      </div>
      <BingoCardPreview />
    </section>
  );
}
