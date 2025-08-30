import { MASTER_COMPANY_LIST } from '../constants';
import type { GameState, GeminiResponse, Company, HoldingCompany } from '../types';

// --- Helper Functions ---
const getRandomNumber = (min: number, max: number) => Math.random() * (max - min) + min;
const shuffleArray = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

// --- Core Simulation Logic ---

/**
 * Generates the list of available actions based on the current game state.
 * This replaces the AI's dynamic action generation.
 */
const generateAvailableActions = (gameState: GameState): string[] => {
    const actions: Set<string> = new Set();

    // Core Actions
    actions.add("Scan the market for additional opportunities.");
    actions.add("View opportunities on the Market Exchange.");
    actions.add("Advance time by one month.");
    actions.add("Advance time by one quarter (3 months).");
    actions.add("Advance time by one year.");

    const allHoldings = [...gameState.portfolio, ...(gameState.holdingCompany?.subsidiaries ?? [])];

    // Holding Company / Subsidiary Actions
    if (!gameState.holdingCompany && gameState.portfolio.length >= 2) {
        actions.add("Establish a parent corporation to manage your assets.");
    }

    gameState.portfolio.forEach(company => {
        const ownership = (company.sharesOwned / company.totalShares) * 100;
        if (ownership > 50) {
            if (gameState.holdingCompany) {
                actions.add(`Restructure ${company.name} as a subsidiary of ${gameState.holdingCompany.name}`);
            }
            // Add a generic "control" action
            actions.add(`Leverage your control of ${company.name} to launch a new initiative.`);
        } else {
             actions.add(`Increase stake in ${company.name}.`);
        }
    });
    
    gameState.holdingCompany?.subsidiaries.forEach(company => {
        actions.add(`Increase stake in ${company.name}.`);
        actions.add(`Review quarterly performance of subsidiary: ${company.name}.`);
    });


    return shuffleArray(Array.from(actions)).slice(0, 5); // Limit actions to a reasonable number
};


/**
 * Processes a generic player action.
 */
export const getNextStep = (currentState: GameState, playerAction: string): GeminiResponse => {
    let response: Partial<GeminiResponse> = {
        newCash: currentState.cash,
        updatedPortfolio: JSON.parse(JSON.stringify(currentState.portfolio)),
        holdingCompany: JSON.parse(JSON.stringify(currentState.holdingCompany)),
    };
    
    if (playerAction.toLowerCase().includes('scan the market')) {
        const currentMarketNames = currentState.marketOpportunities.map(c => c.name);
        const newCompanies = MASTER_COMPANY_LIST.filter(c => !currentMarketNames.includes(c.name));
        const newOpportunities = shuffleArray(newCompanies).slice(0, 5);
        response.sceneDescription = "Your analysts have identified several new high-potential investment targets across various sectors.";
        response.eventLog = "Scanned the market for new opportunities.";
        response.marketOpportunities = newOpportunities;
        response.marketOverview = "The global market is buzzing with activity. Tech remains strong, while the energy sector shows signs of volatility.";
    } 
    else if (playerAction.toLowerCase().includes('advance time')) {
        let timeMultiplier = 1;
        let periodName = "month";
        if(playerAction.toLowerCase().includes('one quarter')) { timeMultiplier = 3; periodName = "quarter"; }
        if(playerAction.toLowerCase().includes('one year')) { timeMultiplier = 12; periodName = "year"; }

        const allHoldings = [...response.updatedPortfolio!, ...(response.holdingCompany?.subsidiaries ?? [])];
        let totalAssetValue = 0;
        allHoldings.forEach(c => totalAssetValue += c.sharesOwned * c.sharePrice);

        const incomeRate = getRandomNumber(0.003, 0.015) * timeMultiplier;
        const income = Math.floor(totalAssetValue * incomeRate);
        response.newCash! += income;

        const volatility = 0.05 * timeMultiplier;
        
        const updatePrices = (companies: Company[]) => {
             return companies.map(c => {
                const changePercent = getRandomNumber(-volatility, volatility);
                c.sharePrice = Math.max(1, c.sharePrice * (1 + changePercent));
                return c;
            });
        }
        
        response.updatedPortfolio = updatePrices(response.updatedPortfolio!);
        if (response.holdingCompany) {
            response.holdingCompany.subsidiaries = updatePrices(response.holdingCompany.subsidiaries);
        }

        response.sceneDescription = `A ${periodName} has passed. The markets were turbulent, but your empire has weathered the storm.`;
        response.eventLog = `Advanced time by one ${periodName}. Earned ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(income)} in income.`;
    }
    else if (playerAction.toLowerCase().includes('leverage your control')) {
        const companyName = playerAction.split('Leverage your control of ')[1].split(' to launch')[0];
        const cost = getRandomNumber(100_000_000, 500_000_000);
        if (response.newCash! > cost) {
            response.newCash! -= cost;
            response.sceneDescription = `You initiated a major project at ${companyName}, asserting your control. The board approved the $${Math.round(cost/1_000_000)}M expenditure, which is expected to boost long-term growth.`;
            response.eventLog = `Spent ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(cost)} on a new initiative at ${companyName}.`;
        } else {
            response.sceneDescription = `You attempted to launch a new initiative at ${companyName}, but lacked the liquid cash to fund the project. The board is disappointed.`;
            response.eventLog = `Failed to fund initiative at ${companyName}.`;
        }
    }
     else if (playerAction.toLowerCase().includes('review quarterly performance')) {
        const companyName = playerAction.split('Review quarterly performance of subsidiary: ')[1];
        response.sceneDescription = `You reviewed the quarterly reports for ${companyName}. Profits are steady, and market share has grown by a small margin. The executive team is performing as expected.`;
        response.eventLog = `Reviewed performance for ${companyName}.`;
    }
    else { // Generic placeholder for other actions
        response.sceneDescription = `You considered the action: "${playerAction}". Your advisors are preparing a report. For now, the status quo is maintained.`;
        response.eventLog = `Analyzed action: ${playerAction}.`;
    }

    // Finalize response object
    const finalResponse: GeminiResponse = {
        sceneDescription: response.sceneDescription || currentState.currentScene,
        eventLog: response.eventLog || "No significant event.",
        updatedPortfolio: response.updatedPortfolio!,
        holdingCompany: response.holdingCompany!,
        newCash: response.newCash!,
        availableActions: generateAvailableActions({ ...currentState, cash: response.newCash!, portfolio: response.updatedPortfolio!, holdingCompany: response.holdingCompany! }),
        isGameOver: response.newCash! < 0,
        gameOverReason: response.newCash! < 0 ? "You have run out of cash and are now bankrupt." : "",
        marketOpportunities: response.marketOpportunities || currentState.marketOpportunities,
    };
    
    return finalResponse;
};

export const buyShares = (currentState: GameState, companyName: string, sharesToBuy: number, sharePrice: number, totalShares: number): GeminiResponse => {
    const totalCost = sharesToBuy * sharePrice;
    if (currentState.cash < totalCost) {
       throw new Error("Insufficient funds for this purchase.");
    }
    
    const newCash = currentState.cash - totalCost;
    const newPortfolio: Company[] = JSON.parse(JSON.stringify(currentState.portfolio));
    const newHoldingCompany: HoldingCompany | null = JSON.parse(JSON.stringify(currentState.holdingCompany));

    let existingHolding = newPortfolio.find(c => c.name === companyName);
    if(!existingHolding && newHoldingCompany) {
        existingHolding = newHoldingCompany.subsidiaries.find(c => c.name === companyName);
    }
    
    if (existingHolding) {
        existingHolding.sharesOwned += sharesToBuy;
    } else {
        newPortfolio.push({ name: companyName, sharesOwned: sharesToBuy, sharePrice, totalShares });
    }
    
    const finalOwnershipTarget = existingHolding || { sharesOwned: sharesToBuy, totalShares };
    const ownership = (finalOwnershipTarget.sharesOwned / finalOwnershipTarget.totalShares) * 100;
    
    let sceneDescription = `The acquisition was successful. You now own ${sharesToBuy.toLocaleString()} more shares of ${companyName}.`;
    if(ownership > 50) {
        sceneDescription += ` This move gives you a controlling stake of ${ownership.toFixed(2)}% in the company!`;
    }

    const finalResponse: GeminiResponse = {
        sceneDescription: sceneDescription,
        eventLog: `Purchased ${sharesToBuy.toLocaleString()} shares of ${companyName} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(totalCost)}.`,
        updatedPortfolio: newPortfolio,
        holdingCompany: newHoldingCompany,
        newCash: newCash,
        availableActions: generateAvailableActions({ ...currentState, cash: newCash, portfolio: newPortfolio, holdingCompany: newHoldingCompany }),
        isGameOver: false,
        gameOverReason: "",
    };

    return finalResponse;
};

export const sellShares = (currentState: GameState, companyName: string, sharesToSell: number): GeminiResponse => {
    const newPortfolio: Company[] = JSON.parse(JSON.stringify(currentState.portfolio));
    const newHoldingCompany: HoldingCompany | null = JSON.parse(JSON.stringify(currentState.holdingCompany));
    
    let companySoldFrom: 'portfolio' | 'subsidiary' | null = null;
    let holding: Company | undefined;

    holding = newPortfolio.find(c => c.name === companyName);
    if(holding) companySoldFrom = 'portfolio';
    
    if(!holding && newHoldingCompany){
        holding = newHoldingCompany.subsidiaries.find(c => c.name === companyName);
        if(holding) companySoldFrom = 'subsidiary';
    }

    if (!holding || !companySoldFrom) {
        throw new Error("Attempted to sell a company not in portfolio.");
    }

    const proceeds = sharesToSell * holding.sharePrice;
    const newCash = currentState.cash + proceeds;

    holding.sharesOwned -= sharesToSell;

    if (holding.sharesOwned <= 0) {
        if (companySoldFrom === 'portfolio') {
            const index = newPortfolio.findIndex(c => c.name === companyName);
            newPortfolio.splice(index, 1);
        } else if (companySoldFrom === 'subsidiary' && newHoldingCompany) {
            const index = newHoldingCompany.subsidiaries.findIndex(c => c.name === companyName);
            newHoldingCompany.subsidiaries.splice(index, 1);
        }
    }
    
    const finalResponse: GeminiResponse = {
        sceneDescription: `You successfully liquidated ${sharesToSell.toLocaleString()} shares of ${companyName}, adding ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(proceeds)} to your cash reserves.`,
        eventLog: `Sold ${sharesToSell.toLocaleString()} shares of ${companyName}.`,
        updatedPortfolio: newPortfolio,
        holdingCompany: newHoldingCompany,
        newCash: newCash,
        availableActions: generateAvailableActions({ ...currentState, cash: newCash, portfolio: newPortfolio, holdingCompany: newHoldingCompany }),
        isGameOver: false,
        gameOverReason: "",
    };
    
    return finalResponse;
};

export const restructureSubsidiary = (gameState: GameState, companyName: string, newHoldingCompanyName?: string): GeminiResponse => {
    const newPortfolio = gameState.portfolio.filter(c => c.name !== companyName);
    const companyToMove = gameState.portfolio.find(c => c.name === companyName);
    const newHoldingCompany = JSON.parse(JSON.stringify(gameState.holdingCompany));

    if (!companyToMove || !newHoldingCompany) {
        throw new Error("Restructure failed: company or holding company not found.");
    }

    newHoldingCompany.subsidiaries.push(companyToMove);
    if (newHoldingCompanyName) {
        newHoldingCompany.name = newHoldingCompanyName;
    }

    const finalResponse: GeminiResponse = {
        sceneDescription: `${companyName} has been successfully integrated as a subsidiary of ${newHoldingCompany.name}. This consolidates your power and streamlines operations.`,
        eventLog: `Restructured ${companyName} into ${newHoldingCompany.name}.`,
        updatedPortfolio: newPortfolio,
        holdingCompany: newHoldingCompany,
        newCash: gameState.cash,
        availableActions: generateAvailableActions({ ...gameState, portfolio: newPortfolio, holdingCompany: newHoldingCompany }),
        isGameOver: false,
        gameOverReason: "",
    };
    return finalResponse;
};

export const establishHoldingCompany = (gameState: GameState, companyName: string): GeminiResponse => {
    const cost = 500_000_000;
    if (gameState.cash < cost) {
       throw new Error("You lack the $500M in liquid capital required to establish a parent corporation.");
    }
    const newCash = gameState.cash - cost;
    const newHoldingCompany: HoldingCompany = { name: companyName, subsidiaries: [] };

    const finalResponse: GeminiResponse = {
        sceneDescription: `The paperwork is signed. "${companyName}" is now your official parent corporation. The $500M fee has been processed.`,
        eventLog: `Established holding company: ${companyName}.`,
        updatedPortfolio: gameState.portfolio, // Unchanged
        holdingCompany: newHoldingCompany,
        newCash: newCash,
        availableActions: generateAvailableActions({ ...gameState, cash: newCash, holdingCompany: newHoldingCompany }),
        isGameOver: false,
        gameOverReason: "",
    };
    return finalResponse;
};
