"use client";

import { useEffect, useReducer } from "react";
import {
  createGame,
  toggleNumber,
  restoreGame,
  STORAGE_KEY,
  type Game,
} from "./engine";

type State = { game: Game | null; notice: string };
type Action =
  | { type: "load"; game: Game; notice: string }
  | { type: "replace"; game: Game }
  | { type: "notice"; notice: string }
  | { type: "toggle"; number: number };
function reducer(state: State, action: Action): State {
  if (action.type === "toggle")
    return {
      ...state,
      game: state.game ? toggleNumber(state.game, action.number) : null,
    };
  if (action.type === "notice") return { ...state, notice: action.notice };
  if (action.type === "load")
    return { game: action.game, notice: action.notice };
  return { ...state, game: action.game };
}

export function useBingo() {
  const [state, dispatch] = useReducer(reducer, { game: null, notice: "" });
  useEffect(() => {
    let game = createGame();
    let notice = "";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const restored = restoreGame(parsed);
        if (restored) game = restored;
        else
          notice =
            "La partida guardada no era válida. Hemos preparado un cartón nuevo.";
      }
    } catch {
      notice =
        "No pudimos recuperar la partida. Puedes jugar con este cartón nuevo.";
    }
    dispatch({ type: "load", game, notice });
  }, []);

  useEffect(() => {
    if (!state.game) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.game));
    } catch {
      dispatch({
        type: "notice",
        notice:
          "El navegador no permite guardar. Puedes jugar, pero el progreso se perderá al salir.",
      });
    }
  }, [state.game]);

  return {
    ...state,
    toggle: (number: number) => dispatch({ type: "toggle", number }),
    restart: (game: Game = createGame()) => dispatch({ type: "replace", game }),
  };
}
