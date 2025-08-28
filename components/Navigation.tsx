import React from 'react';

interface NavigationProps {
  currentPage: 'game' | 'market';
  setCurrentPage: (page: 'game' | 'market') => void;
  hasOpportunities: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage, hasOpportunities }) => {
  const navButtonStyle = "px-6 py-2 rounded-md font-orbitron transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold";
  const activeStyle = "bg-brand-blue/80 text-white";
  const inactiveStyle = "bg-dark-tertiary hover:bg-dark-tertiary/60 text-gray-300";
  const disabledStyle = "bg-dark-tertiary text-gray-500 cursor-not-allowed opacity-50";

  return (
    <nav className="mb-4 flex justify-center space-x-4 p-2 bg-dark-secondary rounded-lg border border-border-color">
      <button
        onClick={() => setCurrentPage('game')}
        className={`${navButtonStyle} ${currentPage === 'game' ? activeStyle : inactiveStyle}`}
        aria-label="Switch to Game screen"
      >
        Game
      </button>
      <button
        onClick={() => setCurrentPage('market')}
        disabled={!hasOpportunities}
        className={`${navButtonStyle} ${currentPage === 'market' ? activeStyle : (hasOpportunities ? inactiveStyle : disabledStyle)}`}
        aria-label={hasOpportunities ? "Go to Market Exchange" : "No market opportunities available. Scan the market first."}
        title={hasOpportunities ? "Go to Market Exchange" : "No market opportunities available. Scan the market first."}
      >
        Market Exchange
        {!hasOpportunities && <span className="text-xs"> (Locked)</span>}
      </button>
    </nav>
  );
};
