// test-run.js
const { createInitialState } = require('./src/state.js');
const { nextTurn } = require('./src/engine/timeEngine.js');
const { updateCapital } = require('./src/actions/economy.js');

// 1. Boot up the game
const gameState = createInitialState();
console.log("=== GAME STARTED ===");

// 2. Simulate Nitish (The Player) buying something
console.log("\n--- Player Action: Buying Seeds ---");
updateCapital(gameState, -500, "Bought Tomato Seeds");

// 3. Simulate clicking "Next Turn" 4 times (to force a season change)
for (let i = 0; i < 4; i++) {
    console.log(`\n=== ADVANCING TO TURN ${gameState.world.currentTurn + 1} ===`);
    nextTurn(gameState);
    
    // Print out the inventory to watch the spoilage happen
    console.log(`Inventory Check: Tomatoes: ${gameState.inventory[0].qty}kg | Wheat: ${gameState.inventory[1].qty}kg`);
}
