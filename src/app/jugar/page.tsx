import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BingoGame } from "@/features/game/components/bingo-game";

export const metadata: Metadata = { title: "Jugar · Bingo Web" };
export default function PlayPage() {
  return (
    <>
      <Header />
      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <p className="eyebrow">TUS CARTONES. TODA LA EMOCIÓN.</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tu próxima partida empieza aquí
        </h1>
        <p className="mb-8 mt-3 text-muted-foreground">
          Añade tus cartones y marca los números que escuches durante la
          partida.
        </p>
        <BingoGame />
      </main>
      <Footer />
    </>
  );
}
