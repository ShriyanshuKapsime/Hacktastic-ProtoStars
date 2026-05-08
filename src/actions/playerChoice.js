/************************************************************
 * Nitish - Decision & Action System
 * ----------------------------------------------------------
 * Compatible with the CURRENT shared gameState structure
 * provided by the team architecture.
 *
 * Uses:
 * - gameState.economy
 * - gameState.inventory[]
 * - gameState.world
 * - telemetry logging
 *
 * GitHub-ready version
 ************************************************************/

import { gameState } from '../state.js';
import {
    updateCapital,
    updateInventory,
    saveGame
} from '../economy/economyManager.js';

/************************************************************
 * CONFIG
 ************************************************************/

const GAME_CONFIG = {
    STORAGE_CAPACITY: 500,

    MAX_TELEMETRY: 1000,

    FUTURE_PRICE_MULTIPLIER: 1.15,

    TRANSPORT_MODES: {
        bullock_cart: {
            costPerKm: 2,
            spoilageRisk: 0.02
        },

        tractor: {
            costPerKm: 5,
            spoilageRisk: 0.10
        },

        truck: {
            costPerKm: 9,
            spoilageRisk: 0.03
        }
    }
};

/************************************************************
 * TELEMETRY LOGGER
 ************************************************************/

function logAction(actionType, data) {

    if (
        gameState.telemetry.length >=
        GAME_CONFIG.MAX_TELEMETRY
    ) {
        gameState.telemetry.shift();
    }

    gameState.telemetry.push({
        actionType,
        data,
        timestamp: Date.now()
    });

    console.log(`[LOG] ${actionType}`, data);
}

/************************************************************
 * HELPER FUNCTIONS
 ************************************************************/

/**
 * Get crop object safely
 */
function getCrop(cropId) {
    return gameState.inventory.find(
        crop => crop.id === cropId
    );
}

/**
 * Get total inventory quantity
 */
function getTotalInventory() {

    return gameState.inventory.reduce(
        (total, crop) => total + crop.qty,
        0
    );
}

/************************************************************
 * STEP 1 — VALIDATION ENGINE
 ************************************************************/

/**
 * Generic action validator
 */
export function canPerform(
    action,
    cost = 0,
    cropId = null,
    quantity = 0
) {

    // Capital check
    if (cost > gameState.economy.capital) {

        return {
            success: false,
            message: 'Not enough capital.'
        };
    }

    // Inventory check
    if (cropId) {

        const crop = getCrop(cropId);

        if (!crop || crop.qty < quantity) {

            return {
                success: false,
                message: 'Not enough inventory.'
            };
        }
    }

    return {
        success: true,
        message: `${action} allowed.`
    };
}

/************************************************************
 * STEP 2 — BUY SEEDS / CROPS
 ************************************************************/

/**
 * Buy crops/seeds
 */
export function buySeeds(
    cropId,
    quantity,
    pricePerKg
) {

    const totalCost =
        quantity * pricePerKg;

    const validation = canPerform(
        'BUY_SEEDS',
        totalCost
    );

    if (!validation.success) {
        return validation.message;
    }

    // Storage capacity check
    if (
        getTotalInventory() + quantity >
        GAME_CONFIG.STORAGE_CAPACITY
    ) {

        return 'Storage capacity exceeded.';
    }

    // Update capital
    const capitalUpdated =
        updateCapital(
            -totalCost,
            `Bought ${quantity}kg of ${cropId}`
        );

    if (!capitalUpdated) {
        return 'Capital update failed.';
    }

    // Update inventory
    const inventoryUpdated =
        updateInventory(
            cropId,
            quantity
        );

    if (!inventoryUpdated) {
        return 'Inventory update failed.';
    }

    logAction('BUY_SEEDS', {
        cropId,
        quantity,
        totalCost
    });

    saveGame();

    return `
Purchased ${quantity}kg of ${cropId}
for ₹${totalCost}.
`;
}

/************************************************************
 * STEP 2 — SELL PRODUCE
 ************************************************************/

/**
 * Sell produce in market
 */
export function sellProduce(
    cropId,
    quantity
) {

    const validation = canPerform(
        'SELL_PRODUCE',
        0,
        cropId,
        quantity
    );

    if (!validation.success) {
        return validation.message;
    }

    // Get market price
    const marketPrice =
        gameState.economy.marketPrices[cropId];

    if (!marketPrice) {
        return 'Market price not found.';
    }

    const totalRevenue =
        quantity * marketPrice;

    // Remove inventory
    const inventoryUpdated =
        updateInventory(
            cropId,
            -quantity
        );

    if (!inventoryUpdated) {
        return 'Inventory update failed.';
    }

    // Add money
    const capitalUpdated =
        updateCapital(
            totalRevenue,
            `Sold ${quantity}kg of ${cropId}`
        );

    if (!capitalUpdated) {
        return 'Capital update failed.';
    }

    logAction('SELL_PRODUCE', {
        cropId,
        quantity,
        marketPrice,
        totalRevenue
    });

    saveGame();

    return `
Sold ${quantity}kg of ${cropId}
for ₹${totalRevenue}.
`;
}

/************************************************************
 * STEP 3 — TRANSPORT SYSTEM
 ************************************************************/

/**
 * Transport produce
 */
export function transportGoods(
    cropId,
    quantity,
    distance,
    transportType
) {

    const validation = canPerform(
        'TRANSPORT_GOODS',
        0,
        cropId,
        quantity
    );

    if (!validation.success) {
        return validation.message;
    }

    const vehicle =
        GAME_CONFIG.TRANSPORT_MODES[
            transportType
        ];

    if (!vehicle) {
        return 'Invalid transport type.';
    }

    // Transport cost scales with quantity
    const transportCost =
        distance *
        vehicle.costPerKm *
        (quantity / 10);

    // Capital validation
    if (
        transportCost >
        gameState.economy.capital
    ) {

        return 'Not enough capital for transport.';
    }

    // Spoilage during transport
    const spoilageLoss =
        Math.floor(
            quantity *
            vehicle.spoilageRisk
        );

    // Remove spoiled amount only
    const inventoryUpdated =
        updateInventory(
            cropId,
            -spoilageLoss
        );

    if (!inventoryUpdated) {
        return 'Transport inventory update failed.';
    }

    // Deduct transport cost
    const capitalUpdated =
        updateCapital(
            -transportCost,
            `Transported ${quantity}kg of ${cropId}`
        );

    if (!capitalUpdated) {
        return 'Transport payment failed.';
    }

    const deliveredQuantity =
        quantity - spoilageLoss;

    logAction('TRANSPORT_GOODS', {
        cropId,
        quantity,
        deliveredQuantity,
        spoilageLoss,
        distance,
        transportType,
        transportCost
    });

    saveGame();

    return `
Transport successful.

Delivered Quantity:
${deliveredQuantity}kg

Spoilage Loss:
${spoilageLoss}kg

Transport Cost:
₹${transportCost}
`;
}

/************************************************************
 * STEP 4 — VALUE ADDITION / PROCESSING
 ************************************************************/

const processingRecipes = {

    tomato: {

        output: 'tomato_puree',

        processingCost: 500,

        conversionRatio: 0.6,

        processingMultiplier: 1.8
    }
};

/**
 * Process raw goods into value-added products
 */
export function processGoods(
    cropId,
    quantity
) {

    const recipe =
        processingRecipes[cropId];

    if (!recipe) {
        return 'No processing recipe available.';
    }

    const validation = canPerform(
        'PROCESS_GOODS',
        recipe.processingCost,
        cropId,
        quantity
    );

    if (!validation.success) {
        return validation.message;
    }

    // Remove raw crop
    const rawRemoved =
        updateInventory(
            cropId,
            -quantity
        );

    if (!rawRemoved) {
        return 'Failed to remove raw inventory.';
    }

    // Deduct processing cost
    const capitalUpdated =
        updateCapital(
            -recipe.processingCost,
            `Processed ${cropId}`
        );

    if (!capitalUpdated) {
        return 'Processing payment failed.';
    }

    // Calculate processed output
    const processedQuantity =
        Math.floor(
            quantity *
            recipe.conversionRatio
        );

    // Add processed goods
    const processedAdded =
        updateInventory(
            recipe.output,
            processedQuantity
        );

    if (!processedAdded) {
        return 'Failed to add processed goods.';
    }

    logAction('PROCESS_GOODS', {
        input: cropId,
        output: recipe.output,
        rawQuantity: quantity,
        processedQuantity,
        processingCost:
            recipe.processingCost
    });

    saveGame();

    return `
Processed ${quantity}kg of ${cropId}
into ${processedQuantity}kg of
${recipe.output}.
`;
}

/************************************************************
 * OPTIONAL — SMART SELLING DECISION
 ************************************************************/

/**
 * Suggest whether player should sell now
 * or wait for better prices
 */
export function getBestSellingDecision(
    cropId
) {

    const crop = getCrop(cropId);

    if (!crop) {
        return 'Crop not found.';
    }

    const currentPrice =
        gameState.economy.marketPrices[cropId];

    const expectedFuturePrice =
        currentPrice *
        GAME_CONFIG.FUTURE_PRICE_MULTIPLIER;

    const expectedSpoilageLoss =
        currentPrice *
        crop.spoilageRate;

    // Final decision logic
    if (
        expectedFuturePrice -
        expectedSpoilageLoss >
        currentPrice
    ) {

        return {
            decision: 'WAIT_FOR_BETTER_PRICE',

            currentPrice,

            expectedFuturePrice
        };
    }

    return {
        decision: 'SELL_NOW',

        currentPrice,

        expectedFuturePrice
    };
}

/************************************************************
 * OPTIONAL — VALUE ADDITION CHECK
 ************************************************************/

/**
 * Check if processing gives
 * better returns than raw sale
 */
export function shouldProcessGoods(
    cropId,
    quantity
) {

    const recipe =
        processingRecipes[cropId];

    if (!recipe) {
        return false;
    }

    const rawPrice =
        gameState.economy.marketPrices[cropId];

    const processedPrice =
        gameState.economy.marketPrices[
            recipe.output
        ];

    const rawRevenue =
        rawPrice * quantity;

    const processedQuantity =
        quantity *
        recipe.conversionRatio;

    const processedRevenue =
        processedQuantity *
        processedPrice;

    const finalProfit =
        processedRevenue -
        recipe.processingCost;

    return {
        shouldProcess:
            finalProfit > rawRevenue,

        rawRevenue,

        processedRevenue,

        finalProfit
    };
}