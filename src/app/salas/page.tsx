import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Rooms } from "@/features/game/components/rooms";

export const metadata: Metadata = { title: "Mis salas · Bingo Web" };

export default function RoomsPage() {
  return (
    <>
      <Header />
      <main className="page-container min-h-[65vh] py-10">
        <p className="eyebrow">TUS SALAS. TUS CARTONES.</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Elige tu sala
        </h1>
        <p className="mb-8 mt-3 text-muted-foreground">
          Entra a una sala para continuar con sus cartones o crea una nueva.
        </p>
        <Rooms />
      </main>
      <Footer />
    </>
  );
}
