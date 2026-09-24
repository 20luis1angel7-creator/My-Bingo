import { Star, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// Ilustración fija: estos valores no representan un cartón generado ni una partida.
const previewNumbers = [
  8,
  22,
  35,
  49,
  64,
  4,
  18,
  42,
  53,
  71,
  13,
  27,
  null,
  47,
  68,
  2,
  20,
  31,
  58,
  75,
  11,
  29,
  44,
  51,
  66,
];
const highlightedPositions = [0, 6, 18, 24];

export function BingoCardPreview() {
  return (
    <figure
      aria-label="Ilustración de un cartón de bingo con una diagonal marcada; solo decorativa"
      className="relative mx-auto flex min-h-[365px] w-full max-w-[480px] items-center justify-center sm:min-h-[440px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 inset-y-5 rounded-[48%] bg-[#ede9fa]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-8 rounded-full border border-dashed border-primary/15"
      />
      <Sparkles
        aria-hidden="true"
        className="absolute right-5 top-6 size-8 text-amber-500"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-12 left-4 size-3 rounded-full bg-primary/30"
      />
      <div
        aria-hidden="true"
        className="relative w-[77%] max-w-[335px] -rotate-6 rounded-[20px] border border-white bg-white p-4 shadow-[0_20px_60px_-20px_#67549d55] sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold tracking-[0.15em] text-primary">
            MI CARTÓN DE LA SUERTE
          </span>
          <span className="whitespace-nowrap text-[9px] text-muted-foreground">
            N.º 001
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {"BINGO".split("").map((letter) => (
            <span
              key={letter}
              className="flex aspect-square items-center justify-center rounded-lg bg-primary text-xl font-extrabold text-white sm:text-2xl"
            >
              {letter}
            </span>
          ))}
          {previewNumbers.map((number, index) => (
            <span
              key={index}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg bg-[#f5f3fa] text-base font-bold text-[#384059] sm:text-xl",
                highlightedPositions.includes(index) &&
                  "bg-[#e8e0ff] text-primary",
                number === null && "bg-[#ffd56b] text-[#735400]",
              )}
            >
              {number === null ? (
                <Star className="size-6 fill-current" />
              ) : (
                number
              )}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-[8px] font-medium tracking-[0.12em] text-muted-foreground">
          UN CARTÓN. MIL BUENOS MOMENTOS.
        </p>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-1 right-1 flex rotate-3 items-center gap-3 rounded-2xl border border-[#eee8da] bg-white px-4 py-3 shadow-lg shadow-[#38305412] sm:bottom-7"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Trophy className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold">¡Que no falte la suerte!</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lo mejor es disfrutar el momento.
          </p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute right-0 top-14 flex size-14 rotate-12 items-center justify-center rounded-full bg-[#ffcf61] shadow-[inset_-4px_-5px_0_#e0a93730,0_8px_20px_#ac833020] sm:right-1"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[#fff8e6] text-lg font-extrabold text-[#876226]">
          8
        </span>
      </div>
    </figure>
  );
}
