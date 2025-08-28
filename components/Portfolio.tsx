
import React, { useState } from 'react';
import type { GameState, Company, HoldingCompany } from '../types';

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-dark-tertiary p-4 rounded-lg border border-border-color">
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-2xl font-orbitron text-brand-gold">{numberFormatter.format(value)}</p>
  </div>
);

const PortfolioItem: React.FC<{ company: Company; onSell: (name: string, shares: number) => void; isLoading: boolean; isSubsidiary?: boolean }> = ({ company, onSell, isLoading, isSubsidiary = false }) => {
    const [sharesToSell, setSharesToSell] = useState('');
    const totalValue = company.sharesOwned * company.sharePrice;
    const ownershipPercentage = (company.sharesOwned / company.totalShares) * 100;
    const isControllingStake = ownershipPercentage > 50;

    const numSharesToSell = parseInt(sharesToSell, 10);
    const isValid = !isNaN(numSharesToSell) && numSharesToSell > 0 && numSharesToSell <= company.sharesOwned;

    const handleSell = () => {
        if (isValid) {
            onSell(company.name, numSharesToSell);
            setSharesToSell('');
        }
    };

    return (
        <li className={`p-3 rounded-md border ${isSubsidiary ? 'bg-dark-tertiary/50 border-border-color/50' : 'bg-dark-tertiary border-border-color'} animate-fadeIn`}>
            <div className="flex justify-between items-center mb-2">
                <div>
                    <p className="font-bold text-gray-100">{company.name}</p>
                    <div className="flex items-baseline text-sm mt-1 space-x-3">
                        <span className="text-gray-400">{company.sharesOwned.toLocaleString()} shares</span>
                        <span 
                           className={`font-semibold ${isControllingStake ? 'text-brand-gold animate-pulseGlow' : 'text-gray-400'}`}
                           title={isControllingStake ? "Controlling Stake!" : "Ownership Percentage"}
                        >
                           {ownershipPercentage.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <p className="font-semibold text-green-400 text-lg">{numberFormatter.format(totalValue)}</p>
            </div>
            <div className="flex items-center space-x-2 mt-2">
                <input
                    type="number"
                    value={sharesToSell}
                    onChange={(e) => setSharesToSell(e.target.value)}
                    placeholder={`Max ${company.sharesOwned.toLocaleString()}`}
                    min="1"
                    max={company.sharesOwned}
                    disabled={isLoading}
                    className="w-full bg-dark-primary border border-border-color rounded-md px-2 py-1 text-sm text-white focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50"
                />
                <button
                    onClick={handleSell}
                    disabled={!isValid || isLoading}
                    className="px-4 py-1 text-xs font-bold rounded-md transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Sell
                </button>
            </div>
        </li>
    );
};

const HoldingCompanyDisplay: React.FC<{ holdingCompany: HoldingCompany; onSell: (name: string, shares: number) => void; isLoading: boolean }> = ({ holdingCompany, onSell, isLoading }) => {
    return (
        <div className="bg-dark-tertiary/70 border border-brand-gold/30 rounded-lg p-3 animate-fadeIn mb-6">
            <h4 className="text-lg font-orbitron text-brand-gold">Parent Corporation</h4>
            <p className="text-2xl font-semibold mb-3">{holdingCompany.name}</p>
            <h5 className="text-md font-orbitron text-brand-blue mb-2">Subsidiaries</h5>
            {holdingCompany.subsidiaries.length > 0 ? (
                 <ul className="space-y-2">
                    {holdingCompany.subsidiaries.map(sub => (
                        <PortfolioItem key={sub.name} company={sub} onSell={onSell} isLoading={isLoading} isSubsidiary />
                    ))}
                 </ul>
            ) : (
                <p className="text-gray-400 italic text-sm">No subsidiaries yet. Acquire a controlling stake in a company to restructure it.</p>
            )}
        </div>
    );
};


interface PortfolioProps {
  gameState: GameState;
  onSell: (companyName: string, shares: number) => void;
  isLoading: boolean;
}

export const Portfolio: React.FC<PortfolioProps> = ({ gameState, onSell, isLoading }) => {
  const hasHoldings = gameState.portfolio.length > 0 || (gameState.holdingCompany && gameState.holdingCompany.subsidiaries.length > 0);
  
  return (
    <aside className="bg-dark-secondary p-4 rounded-lg border border-border-color shadow-md h-full overflow-y-auto">
      <h2 className="text-xl font-orbitron text-brand-blue mb-4 border-b border-border-color pb-2">Financials</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Cash" value={gameState.cash} />
        <StatCard label="Net Worth" value={gameState.netWorth} />
      </div>
      
      {gameState.holdingCompany && <HoldingCompanyDisplay holdingCompany={gameState.holdingCompany} onSell={onSell} isLoading={isLoading} />}
      
      <h3 className="text-lg font-orbitron text-brand-blue mb-3">Independent Holdings</h3>
      {!hasHoldings ? (
         <p className="text-gray-400 italic text-center py-4">No holdings yet. The market awaits.</p>
      ) : gameState.portfolio.length === 0 ? (
        <p className="text-gray-400 italic text-center py-4">All holdings are under {gameState.holdingCompany?.name}.</p>
      ) : (
        <ul className="space-y-3">
          {gameState.portfolio.map((company) => (
            <PortfolioItem key={company.name} company={company} onSell={onSell} isLoading={isLoading} />
          ))}
        </ul>
      )}
    </aside>
  );
};
