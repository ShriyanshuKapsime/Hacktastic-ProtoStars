// src/state.js

export const gameState = {
    economy: {
        capital: 5000,
        loan: 0,
        marketPrices: {
            cabbage: 30,  // Spring
            tomato: 20,   // Summer
            pumpkin: 60,  // Autumn
            wheat: 40     // Autumn/Winter
        }
    },

    inventory: [
        { id: 'cabbage', name: 'Cabbage', qty: 0, spoilageRate: 0.15, seedPrice: 15, seasons: ['Spring'] },
        { id: 'tomato', name: 'Tomatoes', qty: 0, spoilageRate: 0.20, seedPrice: 10, seasons: ['Summer'] },
        { id: 'pumpkin', name: 'Pumpkins', qty: 0, spoilageRate: 0.10, seedPrice: 30, seasons: ['Autumn'] },
        // Wheat is hardy, it can grow in two seasons!
        { id: 'wheat', name: 'Wheat Grain', qty: 0, spoilageRate: 0.05, seedPrice: 20, seasons: ['Autumn', 'Winter'] }
    ],

    world: {
        currentTurn: 1,
        season: 'Spring', // Start in Spring like Stardew!
        weather: 'Sunny',
        weatherModifier: 1.0,
        turnsInCurrentState: 0
    },

    telemetry: []
};
