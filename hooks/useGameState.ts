
import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '../types';
import { INITIAL_GAME_STATE, GAME_STORAGE_KEY } from '../constants';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const savedState = window.localStorage.getItem(GAME_STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Error loading state from localStorage", error);
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error("Error saving state to localStorage", error);
    }
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
  }, []);

  return { gameState, setGameState, resetGame };
};
