import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RoomGame } from "@/features/game/components/room-game";

export const metadata: Metadata = { title: "Jugar · Bingo Web" };
export default function PlayPage() {
  return (
    <>
      <Header />
      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/salas"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Volver a mis salas
        </Link>
        <RoomGame id="principal" />
      </main>
      <Footer />
    </>
  );
}
