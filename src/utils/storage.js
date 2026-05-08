// src/utils/storage.js
import { gameState } from '../state.js';

export function saveGame() {
    // Adding window check so it doesn't crash if you test in terminal
    if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('ruralSimSave', JSON.stringify(gameState));
        console.log("Game Saved Offline!");
    }
}
