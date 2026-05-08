// src/actions/economy.js

import { gameState } from '../state.js';
// import { logAction } from '../utils/telemetry.js'; // Uncomment when you build telemetry

/**
 * Safely adds or removes money from the player's capital.
 * @param {number} amount - Positive to add, negative to subtract.
 * @param {string} reason - Why the money changed (for logs).
 * @returns {boolean} - True if successful, False if player lacks funds.
 */
export function updateCapital(amount, reason) {
    // Prevent going into negative money for purchases
    if (amount < 0 && gameState.economy.capital < Math.abs(amount)) {
        console.warn(`Transaction failed: Not enough capital for ${reason}.`);
        return false; 
    }

    gameState.economy.capital += amount;
    
    // Ensure capital never visually drops below 0 just in case
    if (gameState.economy.capital < 0) {
        gameState.economy.capital = 0; 
    }
    
    console.log(`[ECONOMY] ₹${amount} | Reason: ${reason} | New Balance: ₹${gameState.economy.capital}`);
    return true;
}

/**
 * Safely adds or removes crops from the inventory.
 * @param {string} cropId - The ID of the crop (e.g., 'tomato').
 * @param {number} amountChange - Positive to add, negative to remove/sell.
 * @returns {boolean} - True if successful, False if player lacks inventory.
 */
export function updateInventory(cropId, amountChange) {
    let crop = gameState.inventory.find(c => c.id === cropId);
    
    if (!crop) {
        console.error(`[INVENTORY ERROR] Crop ID '${cropId}' does not exist!`);
        return false;
    }

    // Check if player is trying to sell/use more than they have
    if (amountChange < 0 && crop.qty < Math.abs(amountChange)) {
        console.warn(`[INVENTORY] Failed to remove ${Math.abs(amountChange)}kg of ${cropId}. Only have ${crop.qty}kg.`);
        return false; 
    }

    crop.qty += amountChange;
    console.log(`[INVENTORY] ${cropId} changed by ${amountChange}kg. New Qty: ${crop.qty}kg`);
    return true;
}

/**
 * Calculates and removes spoiled crops based on weather conditions.
 * Krish MUST call this function at the end of every turn.
 */
export function applySpoilage() {
    console.log(`--- Applying Spoilage for Turn ${gameState.world.currentTurn} ---`);
    
    gameState.inventory.forEach(crop => {
        if (crop.qty > 0) {
            // Formula: Qty * Base Spoilage * Weather Multiplier
            let lostAmount = Math.floor(crop.qty * (crop.spoilageRate * gameState.world.weatherModifier));
            
            // Prevent rotting more than we have
            if (lostAmount > crop.qty) lostAmount = crop.qty;

            if (lostAmount > 0) {
                crop.qty -= lostAmount;
                console.log(`[SPOILAGE] Lost ${lostAmount}kg of ${crop.name} due to rot. Remaining: ${crop.qty}kg`);
                
                // logAction('spoilage', `Lost ${lostAmount}kg of ${crop.name}`);
            }
        }
    });
}