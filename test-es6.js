// test-es6.js
import { gameState } from './src/state.js';
import { nextTurn } from './src/engine/timeEngine.js';
import { updateCapital, updateInventory } from './src/actions/economy.js';

console.log("=== STARTING ES6 ENGINE TEST ===");
console.log(`Starting Capital: ₹${gameState.economy.capital}`);
console.log(`Starting Season: ${gameState.world.season}`);

// 1. Simulate the player spending money
console.log("\n--- Player Action: Buying Seeds ---");
updateCapital(-500, "Bought Tomato Seeds");

updateInventory('tomato', 1000);
updateInventory('wheat', 1000);

// 2. Simulate the player clicking "Next Turn" 4 times
console.log("\n--- Advancing Time (4 Turns) ---");
for (let i = 0; i < 4; i++) {
    console.log(`\n>>> Clicking Next Turn... (Turn ${gameState.world.currentTurn + 1})`);

    // Call Krish's Time Engine
    nextTurn();

    // Print the results
    console.log(`World: ${gameState.world.season} | Weather: ${gameState.world.weather} (Modifier: ${gameState.world.weatherModifier})`);
    console.log(`Inventory Check: Tomatoes: ${gameState.inventory[0].qty}kg | Wheat: ${gameState.inventory[1].qty}kg`);
}

console.log("\n=== TEST COMPLETE ===");
console.log(`Final Capital: ₹${gameState.economy.capital}`);
