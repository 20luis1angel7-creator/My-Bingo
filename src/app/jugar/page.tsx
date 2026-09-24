import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BingoGame } from "@/features/game/components/bingo-game";

export const metadata: Metadata = { title: "Jugar · Bingo Web" };
export default function PlayPage() {
  return (
    <>
      <Header />
      <main className="page-container py-10 sm:py-14">
        <p className="eyebrow">UN CARTÓN. TODA LA EMOCIÓN.</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tu próxima partida empieza aquí
        </h1>
        <p className="mb-8 mt-3 text-muted-foreground">
          Marca en tu cartón los números que escuches durante la partida.
        </p>
        <BingoGame />
      </main>
      <Footer />
    </>
  );
}
