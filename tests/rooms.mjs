import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAIN_ROOM,
  deleteRoom,
  ROOMS_KEY,
  readRooms,
  restoreRooms,
  roomStorageKey,
} from "../.test-build/rooms.js";
import { STORAGE_KEY } from "../.test-build/engine.js";

test("rooms preserve the existing storage key and isolate new collections", () => {
  assert.equal(roomStorageKey(MAIN_ROOM.id), STORAGE_KEY);
  assert.notEqual(roomStorageKey("sala-a"), STORAGE_KEY);
  assert.notEqual(roomStorageKey("sala-a"), roomStorageKey("sala-b"));
  assert.deepEqual(restoreRooms([{ id: "sala-a", name: " Domingo " }]), [
    { id: "sala-a", name: "Domingo" },
  ]);
  assert.deepEqual(restoreRooms([MAIN_ROOM]), [MAIN_ROOM]);
});

test("invalid room registries are rejected", () => {
  for (const value of [
    null,
    {},
    [{ id: "../invalid", name: "Sala" }],
    [{ id: "sala-a", name: " " }],
    [
      { id: "sala-a", name: "Sala" },
      { id: "sala-a", name: "Otra" },
    ],
  ]) {
    assert.equal(restoreRooms(value), null);
  }
});

test("deleting rooms removes their cards, preserves other rooms and persists an empty list", () => {
  const other = { id: "sala-a", name: "Domingo" };
  const data = new Map([
    [ROOMS_KEY, JSON.stringify([MAIN_ROOM, other])],
    [STORAGE_KEY, "main cards"],
    [roomStorageKey(other.id), "other cards"],
  ]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  try {
    assert.deepEqual(deleteRoom(MAIN_ROOM.id), [other]);
    assert.equal(data.has(STORAGE_KEY), false);
    assert.equal(data.get(roomStorageKey(other.id)), "other cards");
    assert.deepEqual(readRooms(), [other]);
    assert.deepEqual(deleteRoom(other.id), []);
    assert.equal(data.has(roomStorageKey(other.id)), false);
    assert.deepEqual(readRooms(), []);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("failed room deletion restores the card data", () => {
  const data = new Map([[STORAGE_KEY, "main cards"]]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        if (key === ROOMS_KEY) throw new Error("storage failure");
        data.set(key, value);
      },
      removeItem: (key) => data.delete(key),
    },
  });
  try {
    assert.throws(() => deleteRoom(MAIN_ROOM.id));
    assert.equal(data.get(STORAGE_KEY), "main cards");
    assert.deepEqual(readRooms(), [MAIN_ROOM]);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("room lookup reads saved rooms without changing existing cartones", () => {
  const data = new Map([[STORAGE_KEY, "existing cards"]]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key) => data.get(key) ?? null },
  });
  try {
    assert.deepEqual(readRooms(), [MAIN_ROOM]);
    data.set(ROOMS_KEY, JSON.stringify([{ id: "sala-a", name: "Domingo" }]));
    assert.equal(readRooms()[0].name, "Domingo");
    assert.equal(data.get(STORAGE_KEY), "existing cards");
    data.set(ROOMS_KEY, "invalid JSON");
    assert.throws(() => readRooms());
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});
