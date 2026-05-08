// src/state.js

export const gameState = {
    // 1. The Economy Module (Managed by You & Nitish)
    economy: {
        capital: 5000,           // Starting money in ₹
        loan: 0,                 // Outstanding debt
        marketPrices: {
            tomato: 20,          // ₹ per kg
            wheat: 40,
            rice: 30,
            tomato_puree: 80     // Processed goods have higher value
        }
    },

    // 2. The Inventory Module (Managed by You & Nitish)
    inventory: [
        { id: 'tomato', name: 'Raw Tomatoes', qty: 0, spoilageRate: 0.20 }, // 20% rots per turn
        { id: 'wheat', name: 'Wheat Grain', qty: 0, spoilageRate: 0.05 },   // 5% rots per turn
        { id: 'rice', name: 'Raw Rice', qty: 0, spoilageRate: 0.05 },
        { id: 'tomato_puree', name: 'Tomato Puree', qty: 0, spoilageRate: 0.02 } // Processed = lasts longer
    ],

    // 3. The World Module (Managed by Krish)
    world: {
        currentTurn: 1,
        season: 'Sowing',        // Sowing, Growing, Harvest, Lean
        weather: 'Sunny',        // Sunny, Rainy, Stormy, Drought
        weatherModifier: 1.0     // 1.0 is normal. 1.5 increases spoilage (e.g., Rainy)
    },

    // 4. The Telemetry Module (For the AI Agent later)
    telemetry: [] 
};