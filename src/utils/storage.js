export function saveGame() {
    localStorage.setItem('ruralSimSave', JSON.stringify(gameState));
    console.log("Game Saved Offline!");
}