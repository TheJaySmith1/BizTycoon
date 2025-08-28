
export interface Company {
  name: string;
  sharesOwned: number;
  sharePrice: number;
  totalShares: number;
}

export interface MarketCompany {
  name: string;
  description: string;
  sector: string;
  sharePrice: number;
  hqLocation: string;
  ceo: string;
  totalShares: number;
}

export interface HoldingCompany {
  name: string;
  subsidiaries: Company[];
}

export interface GameState {
  cash: number;
  netWorth: number;
  portfolio: Company[]; // Now represents independent holdings
  marketOpportunities: MarketCompany[];
  currentScene: string;
  availableActions: string[];
  gameLog: string[];
  turn: number;
  isGameOver: boolean;
  gameOverReason: string;
  holdingCompany: HoldingCompany | null;
}

export interface GeminiResponse {
  sceneDescription: string;
  marketOverview?: string;
  eventLog: string;
  companyDetails?: string;
  updatedPortfolio: Company[]; // Represents independent holdings
  marketOpportunities?: MarketCompany[];
  newCash: number;
  availableActions: string[];
  isGameOver?: boolean;
  gameOverReason?: string;
  holdingCompany?: HoldingCompany | null; // Can be null to clear it, or the updated object
}
