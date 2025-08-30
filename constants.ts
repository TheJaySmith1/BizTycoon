import type { GameState, MarketCompany } from './types';

export const GAME_STORAGE_KEY = 'billionaireGameState'; // Reverted key to restore old saves

export const MASTER_COMPANY_LIST: MarketCompany[] = [
    { name: "NVIDIA", description: "Designs GPUs for gaming and professional markets, and SoCs for mobile and automotive.", sector: "Technology", sharePrice: 950, hqLocation: "Santa Clara, USA", ceo: "Jensen Huang", totalShares: 2460000000 },
    { name: "Tesla, Inc.", description: "Manufactures electric vehicles, battery energy storage, and solar products.", sector: "Automotive", sharePrice: 180, hqLocation: "Austin, USA", ceo: "Elon Musk", totalShares: 3180000000 },
    { name: "SpaceX", description: "Designs, manufactures, and launches advanced rockets and spacecraft.", sector: "Aerospace", sharePrice: 105, hqLocation: "Hawthorne, USA", ceo: "Elon Musk", totalShares: 1500000000 },
    { name: "Apple Inc.", description: "Designs, develops, and sells consumer electronics, computer software, and online services.", sector: "Technology", sharePrice: 215, hqLocation: "Cupertino, USA", ceo: "Tim Cook", totalShares: 15500000000 },
    { name: "Microsoft Corp.", description: "Develops, manufactures, licenses, supports, and sells computer software, consumer electronics, and personal computers.", sector: "Technology", sharePrice: 450, hqLocation: "Redmond, USA", ceo: "Satya Nadella", totalShares: 7430000000 },
    { name: "The Walt Disney Company", description: "A diversified worldwide entertainment company with operations in media networks, parks, studio entertainment, and consumer products.", sector: "Entertainment", sharePrice: 102, hqLocation: "Burbank, USA", ceo: "Bob Iger", totalShares: 1830000000 },
    { name: "Netflix, Inc.", description: "A streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries, and more.", sector: "Entertainment", sharePrice: 680, hqLocation: "Los Gatos, USA", ceo: "Ted Sarandos, Greg Peters", totalShares: 442000000 },
    { name: "Warner Bros. Discovery", description: "A premier global media and entertainment company, offering brands and franchises across television, film, streaming, and gaming.", sector: "Entertainment", sharePrice: 7.20, hqLocation: "New York, USA", ceo: "David Zaslav", totalShares: 2440000000 },
    { name: "JPMorgan Chase & Co.", description: "A global leader in financial services, offering solutions to the world's most important corporations, governments, and institutions.", sector: "Finance", sharePrice: 200, hqLocation: "New York, USA", ceo: "Jamie Dimon", totalShares: 2900000000 },
    { name: "Eli Lilly and Company", description: "A global pharmaceutical company that discovers, develops, manufactures, and sells pharmaceutical products.", sector: "Healthcare", sharePrice: 890, hqLocation: "Indianapolis, USA", ceo: "David A. Ricks", totalShares: 950000000 },
    { name: "Saudi Aramco", description: "A Saudi Arabian public petroleum and natural gas company, and one of the largest companies in the world by revenue.", sector: "Energy", sharePrice: 7.5, hqLocation: "Dhahran, Saudi Arabia", ceo: "Amin H. Nasser", totalShares: 242000000000 },
    { name: "Amazon.com, Inc.", description: "Focuses on e-commerce, cloud computing, digital streaming, and artificial intelligence.", sector: "Technology", sharePrice: 185, hqLocation: "Seattle, USA", ceo: "Andy Jassy", totalShares: 10350000000 },
    { name: "Alphabet Inc. (Google)", description: "A multinational conglomerate holding company. It is the parent company of Google and several former Google subsidiaries.", sector: "Technology", sharePrice: 175, hqLocation: "Mountain View, USA", ceo: "Sundar Pichai", totalShares: 12580000000 },
    { name: "Meta Platforms, Inc.", description: "The parent organization of Facebook, Instagram, WhatsApp, and other subsidiaries.", sector: "Technology", sharePrice: 500, hqLocation: "Menlo Park, USA", ceo: "Mark Zuckerberg", totalShares: 2540000000 },
    { name: "Toyota Motor Corp.", description: "A Japanese multinational automotive manufacturer.", sector: "Automotive", sharePrice: 210, hqLocation: "Toyota City, Japan", ceo: "Akio Toyoda", totalShares: 16400000000 },
    { name: "LVMH Moët Hennessy Louis Vuitton", description: "A French multinational holding and conglomerate specializing in luxury goods.", sector: "Consumer Goods", sharePrice: 800, hqLocation: "Paris, France", ceo: "Bernard Arnault", totalShares: 500000000 },
    { name: "Procter & Gamble", description: "An American multinational consumer goods corporation specializing in a wide range of personal health/consumer health, and personal care and hygiene products.", sector: "Consumer Goods", sharePrice: 168, hqLocation: "Cincinnati, USA", ceo: "Jon R. Moeller", totalShares: 2360000000 },
    { name: "Johnson & Johnson", description: "An American multinational corporation founded in 1886 that develops medical devices, pharmaceuticals, and consumer packaged goods.", sector: "Healthcare", sharePrice: 150, hqLocation: "New Brunswick, USA", ceo: "Joaquin Duato", totalShares: 2600000000 }
];

// FIX: Define shuffleArray function to be used in INITIAL_GAME_STATE.
const shuffleArray = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

// This is now a "pre-game" state. The real game starts after company creation in App.tsx.
export const INITIAL_GAME_STATE: GameState = {
  cash: 10000000000, // 10 Billion
  netWorth: 10000000000,
  portfolio: [],
  holdingCompany: null,
  marketOpportunities: shuffleArray([...MASTER_COMPANY_LIST]).slice(0, 11),
  currentScene: "",
  availableActions: [],
  gameLog: [],
  turn: 0,
  isGameOver: false,
  gameOverReason: "",
};
