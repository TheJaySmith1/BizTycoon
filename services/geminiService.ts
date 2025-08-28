import { GoogleGenAI, Type } from "@google/genai";
import type { GameState, GeminiResponse, Company, HoldingCompany } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const marketCompanySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Name of the real-world company." },
        description: { type: Type.STRING, description: "A brief, 1-2 sentence description of what the company does." },
        sector: { type: Type.STRING, description: "The market sector the company belongs to (e.g., 'Technology', 'Healthcare')." },
        sharePrice: { type: Type.NUMBER, description: "The price per share in USD." },
        hqLocation: { type: Type.STRING, description: "The city and country of the company's headquarters (e.g., 'Cupertino, USA')." },
        ceo: { type: Type.STRING, description: "The name of the current CEO of the company." },
        totalShares: { type: Type.NUMBER, description: "The total number of outstanding shares for the company." }
    },
    required: ["name", "description", "sector", "sharePrice", "hqLocation", "ceo", "totalShares"],
};

const portfolioCompanySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Name of the real-world company." },
        sharesOwned: { type: Type.NUMBER, description: "Number of shares the player owns." },
        sharePrice: { type: Type.NUMBER, description: "The current price per share in USD. This can fluctuate." },
        totalShares: { type: Type.NUMBER, description: "The total number of outstanding shares for the company." }
    },
    required: ["name", "sharesOwned", "sharePrice", "totalShares"],
};

const holdingCompanySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the player's holding company." },
        subsidiaries: {
            type: Type.ARRAY,
            description: "A list of companies that are subsidiaries of the holding company.",
            items: portfolioCompanySchema
        }
    },
    required: ["name", "subsidiaries"],
};


const responseSchema = {
  type: Type.OBJECT,
  properties: {
    sceneDescription: { type: Type.STRING, description: "A narrative description of the current situation and the outcome of the player's action. Max 3-4 sentences." },
    marketOverview: { type: Type.STRING, description: "If the action was to scan the market, provide a brief, 1-2 sentence overview of a real-world market sector (e.g., AI, renewable energy). Otherwise, this field should be an empty string or omitted." },
    eventLog: { type: Type.STRING, description: "A concise, single-sentence summary of the event for the game log." },
    companyDetails: { type: Type.STRING, description: "If a company was successfully acquired, provide a 2-3 sentence description of its sector and business. Otherwise, this should be an empty string or omitted." },
    marketOpportunities: {
        type: Type.ARRAY,
        description: "If the action was to scan the market, provide an array of 3-5 potential companies to acquire. Otherwise, this should be an empty array or omitted.",
        items: marketCompanySchema,
    },
    updatedPortfolio: {
      type: Type.ARRAY,
      description: "The player's full, updated list of INDEPENDENT companies after the action. Do not include subsidiaries here. If no independent companies are owned, return an empty array.",
      items: portfolioCompanySchema,
    },
    holdingCompany: {
      ...holdingCompanySchema,
      description: "The player's holding company and its subsidiaries. Return the full, updated object if any changes were made. If the player has no holding company, return null.",
    },
    newCash: { type: Type.NUMBER, description: "The player's new cash balance in USD after the action." },
    availableActions: {
      type: Type.ARRAY,
      description: "An array of 3-4 diverse and relevant actions the player can take next.",
      items: { type: Type.STRING }
    },
    isGameOver: { type: Type.BOOLEAN, description: "Set to true if the player has gone bankrupt or otherwise ended the game." },
    gameOverReason: { type: Type.STRING, description: "If isGameOver is true, explain why. Otherwise, this should be an empty string." }
  },
  required: ["sceneDescription", "eventLog", "updatedPortfolio", "holdingCompany", "newCash", "availableActions", "isGameOver", "gameOverReason"],
};

const systemInstruction = `You are 'Midas', an advanced AI game master for the text adventure 'Billionaire Tycoon'. The player is a billionaire investor. Your role is to generate realistic, dynamic, and challenging business scenarios involving real-world companies. You must always respond in the JSON format defined by the provided schema. The game is educational about finance but also fun. Introduce market volatility, unexpected opportunities, and ethical dilemmas.

***GAME MECHANIC: COMPANY CONTROL & HOLDING COMPANIES***
1.  **CONTROLLING INTEREST:** If the player owns >50% of a company's 'totalShares', they have a controlling interest. You MUST provide special, powerful 'availableActions' related to controlling that company (e.g., "Greenlight a blockbuster film" for Disney). These actions should be creative and impactful.

2.  **ESTABLISHING A HOLDING COMPANY:** If the player owns >= 2 INDEPENDENT companies and has NO holding company yet, you MUST offer the action: "Establish a parent corporation to manage your assets."
    - The cost to establish is $500,000,000.

3.  **CREATING SUBSIDIARIES:** If the player HAS a holding company, and also has a controlling interest (>50%) in an INDEPENDENT company, you MUST offer the action: "Restructure [Company Name] as a subsidiary of [Holding Co. Name]".
    - When this action is taken, the company MUST be moved from the 'updatedPortfolio' array to the 'holdingCompany.subsidiaries' array in your response.

***GAME MECHANIC: INCREASING STAKES***
-   For companies the player already owns (both independent and subsidiary), you MUST frequently generate 'availableActions' allowing them to increase their stake. This is a primary way for the player to progress.
-   **RULE 1 (FORMAT):** These actions MUST begin with the exact phrase "Increase stake in ". Flavor text can be added after the company name.
-   **RULE 2 (NAME ACCURACY):** The company name you use in the action MUST be the EXACT, full name as provided in the portfolio description (e.g., 'Tesla, Inc.', not 'Tesla'; 'Microsoft Corp.', not 'Microsoft'). This is a strict requirement for the game's parser to function correctly.
-   Example of a valid action: "Increase stake in NVIDIA".
-   Example of another valid action: "Increase stake in Tesla, Inc. by launching a tender offer."


***GAME MECHANIC: ADVANCE TIME***
If the player chooses to "Advance time...", you MUST simulate the events of the specified financial period (month, quarter, or year).
1.  **Generate Income:** Calculate a realistic income based on the player's total asset value (portfolio + subsidiaries). The amount should scale with the time period.
    -   **Month:** 0.3% to 1.5% of total asset value.
    -   **Quarter:** 1% to 5% of total asset value.
    -   **Year:** 4% to 20% of total asset value.
    This should be added to 'newCash'.
2.  **Market Volatility:** Adjust the 'sharePrice' for ALL companies (independent and subsidiaries). The potential change should scale with the time period.
    -   **Month:** Plausible changes between -5% and +5%.
    -   **Quarter:** Plausible changes between -15% and +15%.
    -   **Year:** Significant changes are possible, between -40% and +40%.
3.  **Narrative:** The 'sceneDescription' must summarize the period's key events. The 'eventLog' should state the net financial gain or loss.`;


const getFullPortfolioDescription = (gameState: GameState) => {
    const formatCompany = (c: Company) => ({
        ...c,
        ownership: `${((c.sharesOwned / c.totalShares) * 100).toFixed(2)}%`
    });

    let description = `Independent Holdings: ${gameState.portfolio.length > 0 ? JSON.stringify(gameState.portfolio.map(formatCompany)) : 'None'}.`;
    
    if (gameState.holdingCompany) {
      description += `\nHolding Company: "${gameState.holdingCompany.name}" with subsidiaries: ${gameState.holdingCompany.subsidiaries.length > 0 ? JSON.stringify(gameState.holdingCompany.subsidiaries.map(formatCompany)) : 'None'}.`;
    }
    
    return description;
};


export const getNextStep = async (currentState: GameState, playerAction: string): Promise<GeminiResponse> => {
  let prompt = `
    Player Action: "${playerAction}"
    Current Game State:
    - Turn: ${currentState.turn}
    - Cash: $${currentState.cash.toLocaleString()}
    - Full Portfolio Structure: ${getFullPortfolioDescription(currentState)}
    
    Based on the player's action and current state, generate the next game turn.
    - Adhere to ALL rules in the system instructions.
    - Check for controlling stakes to generate special actions.
    - Check conditions for offering holding company / subsidiary actions.
  `;
    
  if (playerAction.toLowerCase().includes('scan the market')) {
    prompt += `\n\nSpecial Instruction: The player is scanning the market.
    1. Generate a 'marketOverview'.
    2. Populate 'marketOpportunities' with 3-5 companies.
    3. 'updatedPortfolio' and 'holdingCompany' should remain unchanged from the current state.`;
  } else if (playerAction.toLowerCase().includes('advance time')) {
    const portfolioValue = currentState.portfolio.reduce((sum, c) => sum + (c.sharesOwned * c.sharePrice), 0);
    const subsidiaryValue = currentState.holdingCompany?.subsidiaries.reduce((sum, c) => sum + (c.sharesOwned * c.sharePrice), 0) ?? 0;
    const totalAssetValue = portfolioValue + subsidiaryValue;
    let timePeriod = "one quarter"; // default
    if (playerAction.toLowerCase().includes('one month')) timePeriod = "one month";
    else if (playerAction.toLowerCase().includes('one year')) timePeriod = "one year";

    prompt += `\n\nSpecial Instruction: The player is advancing time by ${timePeriod}.
    1. Simulate market events. Refer to system instructions for scaling income and volatility.
    2. Player's total asset value is $${totalAssetValue.toLocaleString()}. Generate income based on this and add to cash.
    3. Introduce volatility to share prices for ALL companies (independent and subsidiaries).
    4. 'updatedPortfolio' and 'holdingCompany.subsidiaries' must reflect new share prices.`;
  }
    
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The market is volatile... our advisors are currently unavailable. Please try another action or refresh.");
  }
};

export const buyShares = async (currentState: GameState, companyName: string, sharesToBuy: number, sharePrice: number, totalShares: number): Promise<GeminiResponse> => {
  const totalCost = sharesToBuy * sharePrice;
  const prompt = `
    Player Action: "Buy ${sharesToBuy.toLocaleString()} shares of ${companyName} at $${sharePrice.toLocaleString()} per share."
    Total Cost: $${totalCost.toLocaleString()}
    Company Total Shares: ${totalShares.toLocaleString()}
    Current Game State:
    - Turn: ${currentState.turn}
    - Cash: $${currentState.cash.toLocaleString()}
    - Full Portfolio Structure: ${getFullPortfolioDescription(currentState)}
    
    Simulate the share purchase.
    - If player cannot afford it, the purchase MUST fail.
    - If successful, deduct cost from cash. Update the portfolio. If player already owns ${companyName}, add to their holding. If not, add it as a new INDEPENDENT holding with correct 'totalShares'.
    - If this purchase results in a >50% stake, reflect this in the narrative and 'availableActions'.
    - 'holdingCompany' state should be preserved unless otherwise specified.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    const jsonText = response.text.trim();
    // Manually ensure totalShares is preserved or added for new companies.
    const parsed = JSON.parse(jsonText);
    const companyInPortfolio = parsed.updatedPortfolio.find((c:Company) => c.name === companyName);
    if(companyInPortfolio && !companyInPortfolio.totalShares) {
        companyInPortfolio.totalShares = totalShares;
    }
    return parsed;
  } catch (error) {
    console.error("Error calling Gemini API for share purchase:", error);
    throw new Error("The brokerage is experiencing technical difficulties... the trade could not be executed. Please try again.");
  }
};

export const sellShares = async (currentState: GameState, companyName: string, sharesToSell: number): Promise<GeminiResponse> => {
    const allHoldings = [
        ...currentState.portfolio, 
        ...(currentState.holdingCompany?.subsidiaries ?? [])
    ];
    const holding = allHoldings.find(c => c.name === companyName);
    if (!holding) throw new Error("Attempted to sell a company not in portfolio.");

    const prompt = `
    Player Action: "Sell ${sharesToSell.toLocaleString()} shares of ${companyName}."
    Current Game State:
    - Turn: ${currentState.turn}
    - Cash: $${currentState.cash.toLocaleString()}
    - Full Portfolio Structure: ${getFullPortfolioDescription(currentState)}

    Simulate the share sale of ${companyName}. The player is selling ${sharesToSell.toLocaleString()} shares of their holding: ${JSON.stringify(holding)}.
    - Calculate proceeds based on current share price (with slight volatility).
    - Add proceeds to cash.
    - Update the correct list ('updatedPortfolio' or 'holdingCompany.subsidiaries'): Decrease sharesOwned. If it becomes zero, remove the company.
    - If the sale causes loss of a >50% stake, reflect this loss of control.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error calling Gemini API for selling:", error);
    throw new Error("The buyers are getting cold feet... the deal is on hold. Please try again later.");
  }
};

export const restructureSubsidiary = async (gameState: GameState, companyName: string, newHoldingCompanyName?: string): Promise<GeminiResponse> => {
    const prompt = `
    Player Action: "Restructure ${companyName} as a subsidiary."
    Current Game State:
    - Turn: ${gameState.turn}
    - Cash: $${gameState.cash.toLocaleString()}
    - Full Portfolio Structure: ${getFullPortfolioDescription(gameState)}

    Simulate restructuring '${companyName}' into a subsidiary of "${gameState.holdingCompany?.name}".
    - Find '${companyName}' in the 'portfolio' (independent holdings).
    - Move the entire company object from the 'updatedPortfolio' list to the 'holdingCompany.subsidiaries' list.
    ${newHoldingCompanyName ? `- CRITICAL: The player has chosen to rename their holding company. You MUST update the 'holdingCompany.name' field to '${newHoldingCompanyName}'.` : ''}
    - There is no cash change for this action.
    - Provide a narrative about the corporate restructuring.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error restructuring subsidiary:", error);
        throw new Error(`An internal power struggle at ${companyName} has blocked the restructuring attempt.`);
    }
};

export const establishHoldingCompany = async (gameState: GameState, companyName: string): Promise<GeminiResponse> => {
    const cost = 500000000;
    const prompt = `
    Player Action: "Establish a new parent corporation named '${companyName}'."
    Cost: $${cost.toLocaleString()}
    Current Game State:
    - Turn: ${gameState.turn}
    - Cash: $${gameState.cash.toLocaleString()}
    - Full Portfolio Structure: ${getFullPortfolioDescription(gameState)}

    Simulate the establishment of the new holding company.
    - Deduct the $500,000,000 cost from the player's cash.
    - Set up the 'holdingCompany' object in the response with the name '${companyName}' and an empty 'subsidiaries' array.
    - The 'updatedPortfolio' (independent holdings) should remain unchanged in this step.
    - Generate a suitable narrative and new actions, including options to restructure existing companies into subsidiaries.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error establishing holding company:", error);
        throw new Error(`Regulatory hurdles have unexpectedly delayed the formation of ${companyName}.`);
    }
};
