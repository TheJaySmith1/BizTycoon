import React, { useState, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { getNextStep, buyShares, sellShares, restructureSubsidiary, establishHoldingCompany } from './services/geminiService';
import { Header } from './components/Header';
import { Portfolio } from './components/Portfolio';
import { GameScreen } from './components/GameScreen';
import { Navigation } from './components/Navigation';
import { MarketScreen } from './components/MarketScreen';
import { SetupScreen } from './components/SetupScreen';
import type { GeminiResponse, Company } from './types';
import { INITIAL_GAME_STATE } from './constants';


function App() {
  const { gameState, setGameState, resetGame } = useGameState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'game' | 'market'>('game');

  const processApiResponse = useCallback((response: GeminiResponse) => {
    const portfolioValue = response.updatedPortfolio.reduce((sum, company) => sum + (company.sharesOwned * company.sharePrice), 0);
    
    const newHoldingCompany = response.holdingCompany !== undefined ? response.holdingCompany : gameState.holdingCompany;
    const subsidiaryValue = newHoldingCompany?.subsidiaries.reduce((sum, company) => sum + (company.sharesOwned * company.sharePrice), 0) ?? 0;

    const newNetWorth = response.newCash + portfolioValue + subsidiaryValue;

    const sceneDescription = response.marketOverview
      ? `<div class="p-3 mb-4 bg-dark-tertiary border-l-4 border-brand-blue rounded-r-md animate-fadeIn">
           <h4 class="font-orbitron text-brand-blue text-lg">Market Insight</h4>
           <p class="text-gray-300 italic mt-1">${response.marketOverview}</p>
         </div>
         <p>${response.sceneDescription}</p>`
      : response.sceneDescription;

    const newLogEntries = [response.eventLog];
    if (response.companyDetails) {
      newLogEntries.push(`[Intel]: ${response.companyDetails}`);
    }

    setGameState(prevState => ({
      ...prevState,
      cash: response.newCash,
      portfolio: response.updatedPortfolio,
      holdingCompany: newHoldingCompany,
      netWorth: newNetWorth,
      currentScene: sceneDescription,
      availableActions: response.availableActions,
      marketOpportunities: response.marketOpportunities && response.marketOpportunities.length > 0 ? response.marketOpportunities : prevState.marketOpportunities,
      gameLog: [...prevState.gameLog, ...newLogEntries],
      turn: prevState.turn + 1,
      isGameOver: response.isGameOver ?? false,
      gameOverReason: response.gameOverReason ?? "",
    }));

    if (response.marketOpportunities && response.marketOpportunities.length > 0) {
      setCurrentPage('market');
    }
  }, [setGameState, gameState.holdingCompany]);

  // FIX: Moved handleBuyShares before handleAction because handleAction depends on it.
  const handleBuyShares = useCallback((companyName: string, sharesToBuy: number, sharePrice: number, totalShares: number) => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
        try {
            const response = buyShares(gameState, companyName, sharesToBuy, sharePrice, totalShares);
            processApiResponse(response);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
            setGameState(prevState => ({
                ...prevState,
                gameLog: [...prevState.gameLog, `Purchase Error: ${errorMessage}`]
            }));
        } finally {
            setIsLoading(false);
        }
    }, 50);
  }, [gameState, processApiResponse, setGameState]);

  const handleAction = useCallback((action: string) => {
    setIsLoading(true);
    setError(null);

    // Use a short timeout to allow the UI to update to the loading state
    // before the synchronous (and very fast) logic runs.
    setTimeout(() => {
        // --- Handle special client-side interactive actions FIRST ---
        
        // 1. Navigate to market
        if (action.toLowerCase().includes('view opportunities on the market exchange')) {
            setCurrentPage('market');
            setGameState(prevState => ({
                ...prevState,
                gameLog: [...prevState.gameLog, "Navigated to Market Exchange."]
            }));
            setIsLoading(false);
            return;
        }
        
        // 2. Increase stake in an owned company (robust parser)
        if (action.toLowerCase().startsWith('increase stake in')) {
            const prefix = 'increase stake in ';
            const remainingAction = action.substring(prefix.length);

            const allHoldings = [
                ...gameState.portfolio,
                ...(gameState.holdingCompany?.subsidiaries ?? [])
            ];
            
            let companyInAction: Company | null = null;
            const sortedHoldings = [...allHoldings].sort((a, b) => b.name.length - a.name.length);
            const cleanRemainingAction = remainingAction.toLowerCase().replace(/[.,'&]/g, '').trim();

            for (const company of sortedHoldings) {
                const fullName = company.name.toLowerCase();
                const baseName = fullName.replace(/[.,'&]/g, '').replace(/\s+(inc|corp|corporation|co|company)\s*$/, '').trim();
                const cleanFullName = fullName.replace(/[.,'&]/g, '').trim();

                if (cleanRemainingAction.startsWith(cleanFullName) || (baseName.length > 2 && cleanRemainingAction.startsWith(baseName))) {
                    companyInAction = company;
                    break;
                }
            }

            if (!companyInAction) {
                setError(`Error: Could not parse company name from the action: "${action}". Please try another move.`);
                setIsLoading(false);
                return;
            }
            
            const company = companyInAction;
            const sharesStr = window.prompt(`How many shares of ${company.name} do you want to buy?\n\nCurrent Price: $${company.sharePrice.toLocaleString()}/share\nYour Cash: $${gameState.cash.toLocaleString()}`);
            if (sharesStr === null) { setIsLoading(false); return; }

            const sharesToBuy = parseInt(sharesStr.replace(/,/g, ''), 10);
            if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
                setError("Invalid number of shares entered.");
                setIsLoading(false);
                return;
            }

            const totalCost = sharesToBuy * company.sharePrice;
            if (totalCost > gameState.cash) {
                alert("Insufficient funds for this purchase.");
                setIsLoading(false);
                return;
            }
            
            handleBuyShares(company.name, sharesToBuy, company.sharePrice, company.totalShares);
            return;
        }

        // 3. Restructure a subsidiary
        if (action.toLowerCase().startsWith('restructure')) {
            const match = action.match(/Restructure (.*?) as a subsidiary of/);
            const companyName = match ? match[1].trim() : null;

            if (companyName && gameState.holdingCompany) {
                const currentHoldingCoName = gameState.holdingCompany.name;
                const newName = window.prompt("You are absorbing a new company. You can rename your parent corporation to reflect its new status, or keep the current name.", currentHoldingCoName);
                
                if (newName === null) { setIsLoading(false); return; }

                const finalNewName = newName.trim() && newName.trim() !== currentHoldingCoName ? newName.trim() : undefined;
                try {
                    const response = restructureSubsidiary(gameState, companyName, finalNewName);
                    processApiResponse(response);
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                    setError(errorMessage);
                } finally {
                    setIsLoading(false);
                }
                return;
            }
        } 

        // 4. Establish a holding company
        if (action.toLowerCase().startsWith('establish a parent corporation')) {
            const name = window.prompt("Name your new parent corporation:", "Apex Global Enterprises");
            if (name && name.trim()) {
                try {
                    const response = establishHoldingCompany(gameState, name.trim());
                    processApiResponse(response);
                } catch (e) {
                    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                    setError(errorMessage);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false); // User cancelled
            }
            return;
        }
        
        // --- If no special action, proceed with generic simulation call ---
        try {
          const response = getNextStep(gameState, action);
          processApiResponse(response);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          setError(errorMessage);
          setGameState(prevState => ({
              ...prevState,
              gameLog: [...prevState.gameLog, `Error: ${errorMessage}`]
          }));
        } finally {
          setIsLoading(false);
        }
    }, 50); // 50ms timeout
  }, [gameState, processApiResponse, setGameState, handleBuyShares]);

  const handleSellShares = useCallback((companyName: string, sharesToSell: number) => {
    setIsLoading(true);
    setError(null);
     setTimeout(() => {
        try {
            const response = sellShares(gameState, companyName, sharesToSell);
            processApiResponse(response);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
            setGameState(prevState => ({
                ...prevState,
                gameLog: [...prevState.gameLog, `Sale Error: ${errorMessage}`]
            }));
        } finally {
            setIsLoading(false);
        }
    }, 50);
  }, [gameState, processApiResponse, setGameState]);

  const handleCompanyCreation = (name: string) => {
    // This is a client-side setup
    const cost = 500_000_000;
    const cashAfterFee = INITIAL_GAME_STATE.cash - cost;

    setGameState({
        ...INITIAL_GAME_STATE,
        cash: cashAfterFee,
        netWorth: cashAfterFee,
        holdingCompany: {
            name: name,
            subsidiaries: [],
        },
        turn: 1,
        gameLog: [
            "Game started. Welcome, Tycoon.",
            `Your parent corporation, "${name}", has been established. ($500M fee paid)`,
            "Initial market opportunities have been identified."
        ],
        currentScene: `With "${name}" officially incorporated, the world of high finance is yours to conquer. We've compiled an initial list of high-profile investment opportunities. Review them on the **Market Exchange** and begin building your empire. With over $9 Billion in liquid assets, your first move will make headlines.`,
        availableActions: [
            "View opportunities on the Market Exchange.",
            "Scan the market for additional opportunities.",
            "Advance time by one month.",
        ],
    });
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to reset the game? All progress will be lost.")) {
      resetGame();
      setCurrentPage('game');
    }
  }

  // Show setup screen only for brand new games.
  if (gameState.turn === 0 && !gameState.holdingCompany) {
    return <SetupScreen onCompanyCreated={handleCompanyCreation} />;
  }

  return (
    <div className="min-h-screen bg-dark-primary font-roboto text-gray-200">
      <Header onReset={handleReset} />
      <div className="container mx-auto p-4 max-w-7xl">
        <Navigation 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            hasOpportunities={gameState.marketOpportunities.length > 0}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
          <div className="lg:col-span-1">
            <Portfolio 
                gameState={gameState} 
                onSell={handleSellShares}
                isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            {currentPage === 'game' ? (
                <GameScreen 
                  gameState={gameState} 
                  onAction={handleAction} 
                  isLoading={isLoading}
                  error={error}
                />
            ) : (
                <MarketScreen
                  opportunities={gameState.marketOpportunities}
                  onBuy={handleBuyShares}
                  cash={gameState.cash}
                  isLoading={isLoading}
                />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
