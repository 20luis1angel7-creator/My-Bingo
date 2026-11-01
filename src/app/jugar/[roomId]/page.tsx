import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RoomGame } from "@/features/game/components/room-game";

export const metadata: Metadata = { title: "Sala de bingo · Bingo Web" };

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return (
    <>
      <Header />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/salas"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Volver a mis salas
        </Link>
        <RoomGame key={roomId} id={roomId} />
      </main>
      <Footer />
    </>
  );
}
