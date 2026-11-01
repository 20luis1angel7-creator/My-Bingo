"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { ArrowRight, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restoreCollection } from "../engine";
import {
  MAIN_ROOM,
  ROOMS_KEY,
  readRooms,
  deleteRoom,
  roomStorageKey,
  type Room,
} from "../rooms";

type RoomSummary = Room & { count: number | null };
type State = { rooms: RoomSummary[] | null; error: string };

export function Rooms() {
  const [state, update] = useReducer(
    (state: State, next: Partial<State>) => ({ ...state, ...next }),
    { rooms: null, error: "" },
  );
  const [name, setName] = useState("");
  const [pendingRoom, setPendingRoom] = useState<Room | null>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (pendingRoom) confirmation.current?.showModal();
    else confirmation.current?.close();
  }, [pendingRoom]);

  function confirmDelete() {
    if (!pendingRoom) return;
    try {
      const rooms = deleteRoom(pendingRoom.id);
      update({
        rooms: rooms.map((room) => ({
          ...room,
          count: state.rooms?.find((old) => old.id === room.id)?.count ?? null,
        })),
        error: "",
      });
    } catch {
      update({ error: "No se pudo eliminar la sala. Inténtalo de nuevo." });
    }
    setPendingRoom(null);
  }
  useEffect(() => {
    try {
      const rooms = readRooms().map((room) => {
        const saved = localStorage.getItem(roomStorageKey(room.id));
        let count: number | null = null;
        if (saved) {
          try {
            count = restoreCollection(JSON.parse(saved))?.cards.length ?? null;
          } catch {
            /* Keep the room accessible for recovery. */
          }
        }
        return { ...room, count };
      });
      update({ rooms });
    } catch {
      update({
        error:
          "No pudimos recuperar las salas. Recarga la página para intentarlo de nuevo.",
      });
    }
  }, []);

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !state.rooms) return;
    try {
      const room = {
        id: `sala-${crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join("-")}`,
        name: name.trim(),
      };
      // Read the latest list so another tab's rooms are preserved.
      const rooms = [...readRooms(), room];
      localStorage.setItem(
        roomStorageKey(room.id),
        JSON.stringify({ version: 3, cards: [] }),
      );
      localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
      update({
        rooms: rooms.map((entry) => ({
          ...entry,
          count:
            entry.id === room.id
              ? 0
              : (state.rooms!.find((old) => old.id === entry.id)?.count ??
                null),
        })),
        error: "",
      });
      setName("");
    } catch {
      update({ error: "No se pudo guardar la sala. Inténtalo de nuevo." });
    }
  }

  return (
    <div>
      <form
        onSubmit={createRoom}
        className="mb-8 flex max-w-xl flex-wrap items-end gap-3"
      >
        <label className="min-w-0 flex-1 text-sm font-medium">
          Nombre de la nueva sala
          <input
            className="mt-2 block h-11 w-full rounded-lg border bg-background px-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            placeholder="Por ejemplo: Bingo del domingo"
            required
            disabled={!state.rooms}
          />
        </label>
        <Button
          type="submit"
          className="h-11"
          disabled={!state.rooms || !name.trim()}
        >
          <Plus aria-hidden="true" /> Crear sala
        </Button>
      </form>
      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-100 p-4 text-sm text-amber-950"
        >
          {state.error}
        </p>
      )}
      {!state.rooms && !state.error && <p role="status">Cargando tus salas…</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.rooms?.map((room) => (
          <article
            key={room.id}
            className="group rounded-2xl border bg-white p-6 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <LayoutGrid
                aria-hidden="true"
                className="size-9 rounded-lg bg-primary/10 p-2 text-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                aria-label={`Eliminar sala: ${room.name}`}
                title="Eliminar sala"
                onClick={() => setPendingRoom(room)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <Link
              href={room.id === MAIN_ROOM.id ? "/jugar" : `/jugar/${room.id}`}
              className="block rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
            >
              <h2 className="break-words text-xl font-bold">{room.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {room.count === null
                  ? "Lista para jugar"
                  : `${room.count} ${room.count === 1 ? "cartón guardado" : "cartones guardados"}`}
              </p>
              {room.id === MAIN_ROOM.id && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Aquí están los cartones que ya tenías.
                </p>
              )}
              <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
                Entrar a la sala{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          </article>
        ))}
      </div>
      {state.rooms?.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No tienes salas. Crea una para añadir tus cartones.
        </p>
      )}
      <dialog
        ref={confirmation}
        aria-labelledby="delete-room-title"
        aria-describedby="delete-room-description"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border bg-background p-6 text-foreground shadow-xl backdrop:bg-black/50"
        onCancel={(event) => {
          event.preventDefault();
          setPendingRoom(null);
        }}
      >
        <h2 id="delete-room-title" className="text-lg font-bold">
          ¿Quieres eliminar esta sala?
        </h2>
        <p
          id="delete-room-description"
          className="mt-3 break-words text-sm text-muted-foreground"
        >
          Se eliminará «{pendingRoom?.name}» junto con sus cartones y marcas.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            autoFocus
            onClick={() => setPendingRoom(null)}
          >
            No
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDelete}>
            Sí
          </Button>
        </div>
      </dialog>
      <p className="mt-6 text-xs text-muted-foreground">
        Cada sala guarda sus propios cartones, marcas y opciones para ganar en
        este navegador.
      </p>
    </div>
  );
}
