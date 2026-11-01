"use client";

import Link from "next/link";
import { useEffect, useReducer } from "react";
import { readRooms, roomStorageKey, type Room } from "../rooms";
import { BingoGame } from "./bingo-game";

export function RoomGame({ id }: { id: string }) {
  const [state, load] = useReducer(
    (_state: { room: Room | null; loaded: boolean }, room: Room | null) => ({
      room,
      loaded: true,
    }),
    { room: null, loaded: false },
  );
  useEffect(() => {
    try {
      load(readRooms().find((room) => room.id === id) ?? null);
    } catch {
      load(null);
    }
  }, [id]);
  if (!state.loaded) return <p role="status">Cargando la sala…</p>;
  if (!state.room)
    return (
      <p role="alert">
        No se encontró esta sala en este navegador.{" "}
        <Link href="/salas" className="underline">
          Volver a mis salas
        </Link>
      </p>
    );
  return (
    <>
      <h1 className="mt-4 break-words text-3xl font-extrabold">
        {state.room.name}
      </h1>
      <p className="mb-8 mt-3 text-muted-foreground">
        Añade tus cartones y marca los números que escuches durante la partida.
      </p>
      <BingoGame key={id} storageKey={roomStorageKey(id)} />
    </>
  );
}
