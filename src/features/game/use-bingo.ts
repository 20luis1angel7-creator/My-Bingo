"use client";

import { useEffect, useReducer } from "react";
import {
  createGame,
  addCard,
  removeCard,
  toggleCardNumber,
  restoreCollection,
  STORAGE_KEY,
  type Game,
  type CardCollection,
} from "./engine";

// randomUUID is unavailable on some phones when using a local HTTP address.
function cardId() {
  return (
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) =>
      value.toString(16).padStart(8, "0"),
    ).join("")
  );
}

type State = { collection: CardCollection | null; notice: string };
type Action =
  | { type: "load"; collection: CardCollection; notice: string }
  | { type: "add"; game: Game; id: string }
  | { type: "remove"; id: string }
  | { type: "clear-marks" }
  | { type: "notice"; notice: string }
  | { type: "toggle"; id: string; number: number };
function reducer(state: State, action: Action): State {
  if (action.type === "notice") return { ...state, notice: action.notice };
  if (action.type === "load")
    return { collection: action.collection, notice: action.notice };
  if (!state.collection) return state;
  if (action.type === "clear-marks")
    return {
      ...state,
      collection: {
        ...state.collection,
        cards: state.collection.cards.map((card) => ({
          ...card,
          game: { ...card.game, marked: [] },
        })),
      },
    };
  if (action.type === "add")
    return {
      ...state,
      collection: addCard(state.collection, action.game, action.id),
    };
  if (action.type === "remove")
    return { ...state, collection: removeCard(state.collection, action.id) };
  return {
    ...state,
    collection: toggleCardNumber(state.collection, action.id, action.number),
  };
}

export function useBingo() {
  const [state, dispatch] = useReducer(reducer, {
    collection: null,
    notice: "",
  });
  useEffect(() => {
    let collection: CardCollection = {
      version: 3,
      cards: [{ id: cardId(), game: createGame() }],
    };
    let notice = "";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restored = restoreCollection(JSON.parse(saved));
        if (restored) collection = restored;
        else
          notice =
            "Los datos guardados no eran válidos. Hemos preparado un cartón nuevo.";
      }
    } catch {
      notice =
        "No pudimos recuperar tus cartones. Puedes añadirlos para jugar.";
    }
    dispatch({ type: "load", collection, notice });
  }, []);

  useEffect(() => {
    if (!state.collection) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.collection));
    } catch {
      dispatch({
        type: "notice",
        notice:
          "El navegador no permite guardar. Puedes jugar, pero los cartones y sus marcas se perderán al salir.",
      });
    }
  }, [state.collection]);

  return {
    ...state,
    toggle: (id: string, number: number) =>
      dispatch({ type: "toggle", id, number }),
    add: (game: Game = createGame()) =>
      dispatch({ type: "add", game, id: cardId() }),
    remove: (id: string) => dispatch({ type: "remove", id }),
    clearMarks: () => dispatch({ type: "clear-marks" }),
  };
}
