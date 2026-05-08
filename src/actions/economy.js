// src/actions/economy.js

import { gameState } from '../state.js';
import { logAction } from '../utils/telemetry.js';

// ==========================================
// 1. GAME CONSTANTS
// ==========================================

const SEED_CATALOG = {
    tomato: { cost: 15, validSeasons: ['Spring', 'Summer'] },
    rice:   { cost: 20, validSeasons: ['Monsoon'] },
    wheat:  { cost: 10, validSeasons: ['Winter'] }
};

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

/**
 * Safely finds or creates an inventory item.
 */
function getOrCreateInventoryItem(cropId) {
    let inventoryItem = gameState.inventory.find(c => c.id === cropId);

    if (!inventoryItem) {
        // If it doesn't exist yet, give it some default values based on the ID
        inventoryItem = {
            id: cropId,
            qty: 0,
            spoilageRate: cropId === 'tomato_puree' ? 0.02 : 0.05 // Example logic
        };
        gameState.inventory.push(inventoryItem);
    }
    return inventoryItem;
}

/**
 * Validates that a quantity is a positive number.
 */
function isValidQuantity(quantity) {
    return typeof quantity === 'number' && !isNaN(quantity) && quantity > 0;
}

/**
 * Calculates the total kg currently stored in the inventory.
 */
function getCurrentStorageLoad() {
    return gameState.inventory.reduce((total, item) => total + item.qty, 0);
}

// ==========================================
// 3. CENTRAL TRANSACTION SYSTEM
// ==========================================

/**
 * The ONLY function that modifies player capital.
 * @param {number} amount
 * @param {string} type - Telemetry type (e.g., 'SEED_PURCHASE')
 * @param {string} reason - Human-readable reason
 * @returns {boolean}
 */
export function processTransaction(amount, type, reason) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.error('[ECONOMY ERROR] Invalid transaction amount');
        return false;
    }

    // Prevent overdraft for expenses
    if (amount < 0 && gameState.economy.capital < Math.abs(amount)) {
        console.warn(`[ECONOMY DECLINED] Insufficient funds for: ${reason}`);
        return false;
    }

    amount = Math.round(amount);
    gameState.economy.capital += amount;

    console.log(`[ECONOMY] ₹${amount} | ${type} | ${reason} | Balance: ₹${gameState.economy.capital}`);

    logAction('TRANSACTION', {
        amount,
        type,
        reason,
        newBalance: gameState.economy.capital,
        season: gameState.world.season
    });

    return true;
}

// ==========================================
// 4. BUY SEEDS
// ==========================================

/**
 * Buys seeds if constraints are met (season, money, storage).
 */
export function buySeeds(cropId, quantity) {
    if (!isValidQuantity(quantity)) {
        console.warn('[BUY FAILED] Invalid quantity');
        return false;
    }

    const currentSeason = gameState.world.season;
    const seedInfo = SEED_CATALOG[cropId];

    if (!seedInfo) {
        console.error(`[SYSTEM ERROR] ${cropId} not found in seed catalog`);
        return false;
    }

    if (!seedInfo.validSeasons.includes(currentSeason)) {
        console.warn(`[GAME RULE] Cannot plant ${cropId} during ${currentSeason}`);
        return false;
    }

    // STORAGE CHECK: Ensure we don't exceed max capacity
    const currentLoad = getCurrentStorageLoad();
    if (currentLoad + quantity > gameState.economy.maxStorage) {
        console.warn(`[STORAGE ERROR] Warehouse full! Cannot store ${quantity}kg.`);
        return false;
    }

    const totalCost = Math.round(seedInfo.cost * quantity);

    const paymentSuccess = processTransaction(
        -totalCost,
        'SEED_PURCHASE',
        `Bought ${quantity}kg of ${cropId} seeds`
    );

    if (!paymentSuccess) return false;

    const inventoryItem = getOrCreateInventoryItem(cropId);
    inventoryItem.qty += quantity;

    console.log(`[INVENTORY] Added ${quantity}kg ${cropId} | Total: ${inventoryItem.qty}kg`);
    logAction('INVENTORY_UPDATE', { cropId, quantityAdded: quantity, totalQuantity: inventoryItem.qty });

    return true;
}

// ==========================================
// 5. SELL CROPS
// ==========================================

/**
 * Sells crops and adds revenue to capital.
 */
export function sellCrop(cropId, quantity) {
    if (!isValidQuantity(quantity)) {
        console.warn('[SELL FAILED] Invalid quantity');
        return false;
    }

    const inventoryItem = gameState.inventory.find(c => c.id === cropId);

    if (!inventoryItem || inventoryItem.qty < quantity) {
        console.warn(`[INVENTORY ERROR] Cannot sell ${quantity}kg of ${cropId}. Available: ${inventoryItem ? inventoryItem.qty : 0}kg`);
        return false;
    }

    const currentPrice = gameState.economy.marketPrices[cropId];

    if (currentPrice === undefined || currentPrice === null || isNaN(currentPrice)) {
        console.error(`[MARKET ERROR] Invalid market price for ${cropId}`);
        return false;
    }

    const totalRevenue = Math.round(currentPrice * quantity);

    const success = processTransaction(
        totalRevenue,
        'CROP_SALE',
        `Sold ${quantity}kg of ${cropId} at ₹${currentPrice}/kg`
    );

    if (!success) return false;

    inventoryItem.qty -= quantity;

    console.log(`[SALE SUCCESS] Sold ${quantity}kg ${cropId} | Remaining: ${inventoryItem.qty}kg`);
    logAction('INVENTORY_UPDATE', { cropId, quantityRemoved: quantity, totalQuantity: inventoryItem.qty });

    return true;
}

// ==========================================
// 6. SPOILAGE SYSTEM
// ==========================================

/**
 * Applies spoilage at the end of the turn based on weather.
 */
export function applySpoilage(weather) {
    let weatherModifier = 1.0;
    if (weather === 'Rainy') weatherModifier = 1.2;
    if (weather === 'Extreme') weatherModifier = 1.5;

    gameState.inventory.forEach(crop => {
        if (crop.qty <= 0) return;

        let loss = Math.floor(crop.qty * (crop.spoilageRate * weatherModifier));
        if (loss > crop.qty) loss = crop.qty;
        if (loss <= 0) return;

        crop.qty -= loss;

        const marketPrice = gameState.economy.marketPrices[crop.id] || 0;
        const economicLoss = Math.round(loss * marketPrice);

        console.log(`[SPOILAGE] Lost ${loss}kg of ${crop.id} | Economic Loss: ₹${economicLoss}`);

        logAction('SPOILAGE', {
            cropId: crop.id,
            quantityLost: loss,
            economicLoss,
            weather,
            remainingQuantity: crop.qty
        });
    });
}