import React, { useState, useMemo } from 'react';
import type { MarketCompany } from '../types';

interface MarketScreenProps {
  opportunities: MarketCompany[];
  onBuy: (companyName: string, shares: number, sharePrice: number, totalShares: number) => void;
  cash: number;
  isLoading: boolean;
}

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
});

const CompanyCard: React.FC<{ company: MarketCompany; onBuy: (name: string, shares: number, price: number, totalShares: number) => void; cash: number; isLoading: boolean }> = ({ company, onBuy, cash, isLoading }) => {
    const [buyMode, setBuyMode] = useState<'shares' | 'percentage'>('shares');
    const [inputValue, setInputValue] = useState('');

    const { sharesToBuy, percentageToBuy, totalCost, isValid, canAfford } = useMemo(() => {
        const numValue = parseFloat(inputValue);

        if (isNaN(numValue) || numValue <= 0) {
            return { sharesToBuy: 0, percentageToBuy: 0, totalCost: 0, isValid: false, canAfford: false };
        }

        let shares: number;
        let percentage: number;

        if (buyMode === 'shares') {
            shares = Math.floor(numValue);
            percentage = (shares / company.totalShares) * 100;
        } else { // percentage
            let tempPercentage = numValue;
            if (tempPercentage > 100) tempPercentage = 100;
            shares = Math.floor((tempPercentage / 100) * company.totalShares);
            percentage = (shares / company.totalShares) * 100; // Recalculate for accuracy after floor
        }

        const cost = shares * company.sharePrice;
        const valid = shares > 0;
        const afford = cost > 0 && cash >= cost;
        
        return { sharesToBuy: shares, percentageToBuy: percentage, totalCost: cost, isValid: valid, canAfford: afford };
    }, [inputValue, buyMode, company.sharePrice, company.totalShares, cash]);


    const handleBuy = () => {
        if (isValid && canAfford) {
            onBuy(company.name, sharesToBuy, company.sharePrice, company.totalShares);
            setInputValue('');
        }
    };
    
    const handleModeToggle = (mode: 'shares' | 'percentage') => {
        if (buyMode !== mode) {
            setInputValue('');
            setBuyMode(mode);
        }
    };

    return (
        <div className="bg-dark-tertiary p-4 rounded-lg border border-border-color flex flex-col justify-between animate-fadeIn shadow-lg">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-orbitron text-brand-gold">{company.name}</h3>
                    <p className="text-lg font-semibold text-gray-100">${company.sharePrice.toLocaleString()}<span className="text-sm text-gray-400">/share</span></p>
                </div>
                <p className="text-sm text-brand-blue mb-2">{company.sector}</p>
                <div className="text-xs text-gray-400 mt-2 mb-3 space-y-1">
                    <p><strong>CEO:</strong> {company.ceo}</p>
                    <p><strong>HQ:</strong> {company.hqLocation}</p>
                    <p><strong>Total Shares:</strong> {compactNumberFormatter.format(company.totalShares)}</p>
                </div>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">{company.description}</p>
            </div>
            <div className="mt-auto pt-4 border-t border-border-color/50">
                <div className="flex justify-center mb-2 bg-dark-primary p-1 rounded-md border border-border-color">
                    <button onClick={() => handleModeToggle('shares')} className={`w-1/2 text-center text-xs py-1 rounded-sm transition-colors ${buyMode === 'shares' ? 'bg-brand-blue text-white' : 'hover:bg-dark-tertiary'}`}>
                        # of Shares
                    </button>
                    <button onClick={() => handleModeToggle('percentage')} className={`w-1/2 text-center text-xs py-1 rounded-sm transition-colors ${buyMode === 'percentage' ? 'bg-brand-blue text-white' : 'hover:bg-dark-tertiary'}`}>
                        % of Company
                    </button>
                </div>

                 <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={buyMode === 'shares' ? 'Enter shares' : 'Enter percentage'}
                        min="0"
                        step={buyMode === 'shares' ? '1' : '0.01'}
                        max={buyMode === 'percentage' ? '100' : undefined}
                        disabled={isLoading}
                        className="w-full bg-dark-primary border border-border-color rounded-md px-2 py-1.5 text-sm text-white focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50"
                    />
                    <button 
                        onClick={handleBuy}
                        disabled={!canAfford || isLoading || !isValid}
                        className={`px-4 py-1.5 font-bold rounded-md transition-colors duration-200 text-sm whitespace-nowrap
                            ${canAfford && isValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 cursor-not-allowed text-gray-300'}
                            ${isLoading ? 'opacity-50' : ''}`}
                        title={!isValid ? "Enter a valid amount" : (canAfford ? `Buy ${company.name} shares` : "Insufficient funds")}
                    >
                        {isLoading ? '...' : 'Buy'}
                    </button>
                 </div>
                 <div className="h-8 pt-1">
                    {isValid && (
                        <p className="text-xs text-gray-400 text-left animate-fadeIn">
                            {buyMode === 'shares' ?
                                <>Equals <strong>{percentageToBuy.toFixed(4)}%</strong> of the company.</> :
                                <>Equals <strong>{sharesToBuy.toLocaleString()}</strong> shares.</>
                            }
                        </p>
                    )}
                    {totalCost > 0 && (
                        <p className={`text-xs text-right -mt-4 ${totalCost > cash ? 'text-red-400' : 'text-gray-400'}`}>
                            Total: {currencyFormatter.format(totalCost)}
                        </p>
                    )}
                 </div>
            </div>
        </div>
    );
};


export const MarketScreen: React.FC<MarketScreenProps> = ({ opportunities, onBuy, cash, isLoading }) => {
  if (opportunities.length === 0) {
    return (
      <div className="bg-dark-secondary p-8 rounded-lg border border-border-color h-full flex flex-col justify-center items-center text-center">
        <h2 className="text-2xl font-orbitron text-brand-blue mb-4">Market Exchange is Quiet</h2>
        <p className="text-gray-400">No active opportunities. Go back to the game and 'Scan the market' to find potential investments.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-secondary p-4 rounded-lg border border-border-color h-full overflow-y-auto">
      <h2 className="text-2xl font-orbitron text-brand-blue mb-4 border-b border-border-color pb-2">Available Opportunities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {opportunities.map(company => (
            <CompanyCard 
                key={company.name} 
                company={company} 
                onBuy={onBuy}
                cash={cash}
                isLoading={isLoading}
            />
        ))}
      </div>
    </div>
  );
};
