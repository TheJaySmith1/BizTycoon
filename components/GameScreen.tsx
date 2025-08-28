import React, { useRef, useEffect } from 'react';
import type { GameState } from '../types';
import { ActionButton } from './ActionButton';
import { LoadingSpinner } from './LoadingSpinner';

interface GameScreenProps {
  gameState: GameState;
  onAction: (action: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, onAction, isLoading, error }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.gameLog]);

  return (
    <main className="bg-dark-secondary p-4 rounded-lg border border-border-color shadow-md flex flex-col h-full">
      <div className="mb-4 animate-fadeIn">
        <h2 className="text-xl font-orbitron text-brand-blue mb-2">Current Situation</h2>
        <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: gameState.currentScene }} />
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="text-lg font-orbitron text-brand-blue mb-2">Game Log</h3>
        <div className="bg-dark-tertiary p-3 rounded-md border border-border-color mb-4 flex-grow overflow-y-auto min-h-[150px]">
          {gameState.gameLog.map((entry, index) => (
            <p key={index} className={`text-sm ${index === gameState.gameLog.length - 1 ? 'text-white animate-fadeIn' : 'text-gray-400'}`}>
              <span className="text-brand-blue mr-2">&gt;</span>{entry}
            </p>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-orbitron text-brand-blue mb-3">Your Move</h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : gameState.isGameOver ? (
          <div className="text-center p-4 bg-red-900/50 border border-red-500 rounded-lg animate-pulseGlow">
             <h4 className="text-2xl font-bold text-red-400">GAME OVER</h4>
             <p className="text-gray-200 mt-2">{gameState.gameOverReason}</p>
          </div>
        ) : (
          <div className="space-y-3">
             {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
            {gameState.availableActions.map((action) => (
              <ActionButton key={action} action={action} onClick={onAction} disabled={isLoading} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
