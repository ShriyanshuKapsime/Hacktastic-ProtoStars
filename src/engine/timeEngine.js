// src/engine/timeEngine.js
import { gameState } from '../state.js';
import { applySpoilage } from '../actions/economy.js';
import { saveGame } from '../utils/storage.js';

const Seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];

function advanceSeason() {
    const currentIdx = Seasons.indexOf(gameState.world.season);
    const nextIdx = (currentIdx + 1) % Seasons.length;
    
    gameState.world.season = Seasons[nextIdx];
    gameState.world.turnsInCurrentState = 0;
    
    console.log(`[TIME] Season changed to ${gameState.world.season}`);
}

function generateWeather() {
    const rand = Math.random();
    let newWeather = 'Sunny';
    
    if (rand > 0.9) {
        newWeather = 'Extreme';
    } else if (rand > 0.7) {
        newWeather = 'Rainy';
    }

    gameState.world.weather = newWeather;
    
    // Extreme weather makes it hotter/harder to store goods
    gameState.world.weatherModifier = (newWeather === 'Extreme') ? 1.5 : 1.0; 
    
    console.log(`[TIME] Weather updated to ${newWeather}`);
}

export function nextTurn() {
    gameState.world.currentTurn += 1;
    
    // Initialize if it doesn't exist
    if (gameState.world.turnsInCurrentState === undefined) {
        gameState.world.turnsInCurrentState = 0;
    }
    gameState.world.turnsInCurrentState += 1;

    // 1. Check for season change (every 4 turns now!)
    if (gameState.world.turnsInCurrentState >= 4) {
        advanceSeason();
    }

    // 2. Generate new weather
    generateWeather();

    // 3. Apply economic rules (Spoilage with the new Stardew penalty!)
    applySpoilage();

    // 4. Save and end
    saveGame();
    
    return gameState;
}
