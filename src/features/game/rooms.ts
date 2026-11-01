import { STORAGE_KEY } from "./engine";

export type Room = { id: string; name: string };
export const ROOMS_KEY = "bingo-web-rooms-v1";
export const MAIN_ROOM: Room = { id: "principal", name: "Sala principal" };

export function roomStorageKey(id: string) {
  return id === MAIN_ROOM.id ? STORAGE_KEY : `${STORAGE_KEY}-room-${id}`;
}

export function restoreRooms(value: unknown): Room[] | null {
  if (!Array.isArray(value)) return null;
  const ids = new Set<string>();
  const rooms: Room[] = [];
  for (const room of value) {
    if (
      !room ||
      typeof room !== "object" ||
      typeof room.id !== "string" ||
      !/^[a-zA-Z0-9-]+$/.test(room.id) ||
      typeof room.name !== "string" ||
      !room.name.trim() ||
      room.name.length > 60
    )
      return null;
    if (ids.has(room.id)) return null;
    ids.add(room.id);
    rooms.push(
      room.id === MAIN_ROOM.id
        ? MAIN_ROOM
        : { id: room.id, name: room.name.trim() },
    );
  }
  return rooms;
}

export function readRooms(): Room[] {
  const saved = localStorage.getItem(ROOMS_KEY);
  if (!saved) return [MAIN_ROOM];
  const rooms = restoreRooms(JSON.parse(saved));
  if (!rooms) throw new Error("Invalid rooms");
  return rooms;
}

export function deleteRoom(id: string): Room[] {
  const rooms = readRooms().filter((room) => room.id !== id);
  const key = roomStorageKey(id);
  const saved = localStorage.getItem(key);
  localStorage.removeItem(key);
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  } catch (error) {
    if (saved !== null) localStorage.setItem(key, saved);
    throw error;
  }
  return rooms;
}
