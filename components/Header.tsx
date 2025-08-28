
import React from 'react';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  return (
    <header className="bg-dark-secondary border-b-2 border-border-color p-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-2m0 0c-1.657 0-3-.895-3-2s1.343-2 3-2m0 8c1.11 0 2.08-.402 2.599-1M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h1 className="text-2xl md:text-3xl font-orbitron text-gray-100 tracking-wider">
          Billionaire <span className="text-brand-gold">Tycoon</span>
        </h1>
      </div>
      <button 
        onClick={onReset}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors duration-200 text-sm"
      >
        Reset Game
      </button>
    </header>
  );
};
