// Game Configuration
const CONFIG = {
    WORLD_SIZE: 5000,
    FOOD_COUNT: 500,
    BOT_COUNT: 20,
    MIN_FOOD_SIZE: 5,
    MAX_FOOD_SIZE: 8,
    MIN_BOT_SIZE: 15,
    MAX_BOT_SIZE: 30,
    PLAYER_START_SIZE: 20,
    MAX_CELL_SIZE: 200,
    SPEED_MULTIPLIER: 0.5,
    SPLIT_SPEED: 15,
    MIN_SPLIT_SIZE: 35,
    SPLIT_COOLDOWN: 30000, // 30 seconds
};

// Game State
const gameState = {
    player: null,
    playerCells: [], // All player-controlled cells (for split mechanic)
    food: [],
    bots: [],
    camera: { x: 0, y: 0 },
    lastSplitTime: 0,
    leaderboard: []
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Utility Functions
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
        '#EC7063', '#5DADE2', '#58D68D', '#F4D03F', '#AF7AC5'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Cell Class
class Cell {
    constructor(x, y, size, color, isPlayer = false, isBot = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.isPlayer = isPlayer;
        this.isBot = isBot;
        this.mass = size;
        this.targetX = x;
        this.targetY = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.name = isPlayer ? 'You' : (isBot ? `Bot ${Math.floor(Math.random() * 1000)}` : '');
    }

    update() {
        // Calculate velocity towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            // Speed decreases as size increases
            const speed = (CONFIG.SPEED_MULTIPLIER * 10) / Math.sqrt(this.size);
            this.velocityX = (dx / dist) * speed;
            this.velocityY = (dy / dist) * speed;
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Keep within world bounds
        this.x = Math.max(this.size, Math.min(CONFIG.WORLD_SIZE - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.WORLD_SIZE - this.size, this.y));

        // Update size based on mass
        this.size = Math.sqrt(this.mass) * 2;
    }

    draw(cameraX, cameraY) {
        const screenX = this.x - cameraX + canvas.width / 2;
        const screenY = this.y - cameraY + canvas.height / 2;

        // Draw cell
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw name if it exists
        if (this.name) {
            ctx.fillStyle = 'white';
            ctx.font = `${Math.max(12, this.size / 2)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.name, screenX, screenY);
        }
    }

    canEat(other) {
        if (this === other) return false;
        if (this.mass <= other.mass * 0.8) return false; // Need to be 20% larger
        const dist = distance(this.x, this.y, other.x, other.y);
        return dist < this.size - other.size * 0.5;
    }
}

// Initialize Player
function initPlayer() {
    const startX = CONFIG.WORLD_SIZE / 2;
    const startY = CONFIG.WORLD_SIZE / 2;
    gameState.player = new Cell(
        startX,
        startY,
        CONFIG.PLAYER_START_SIZE,
        randomColor(),
        true
    );
    gameState.player.name = 'You';
    gameState.playerCells = [gameState.player];
}

// Initialize Food
function initFood() {
    gameState.food = [];
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        const size = random(CONFIG.MIN_FOOD_SIZE, CONFIG.MAX_FOOD_SIZE);
        gameState.food.push(new Cell(
            random(size, CONFIG.WORLD_SIZE - size),
            random(size, CONFIG.WORLD_SIZE - size),
            size,
            randomColor()
        ));
    }
}

// Initialize Bots
function initBots() {
    gameState.bots = [];
    for (let i = 0; i < CONFIG.BOT_COUNT; i++) {
        const size = random(CONFIG.MIN_BOT_SIZE, CONFIG.MAX_BOT_SIZE);
        const bot = new Cell(
            random(size, CONFIG.WORLD_SIZE - size),
            random(size, CONFIG.WORLD_SIZE - size),
            size,
            randomColor(),
            false,
            true
        );
        gameState.bots.push(bot);
    }
}

// Update Camera
function updateCamera() {
    if (gameState.player) {
        gameState.camera.x = gameState.player.x;
        gameState.camera.y = gameState.player.y;
    }
}

// Mouse Controls
canvas.addEventListener('mousemove', (e) => {
    if (gameState.playerCells.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        const targetX = gameState.camera.x + (mouseX - canvas.width / 2);
        const targetY = gameState.camera.y + (mouseY - canvas.height / 2);
        
        // All player cells move towards the same target
        gameState.playerCells.forEach(cell => {
            cell.targetX = targetX;
            cell.targetY = targetY;
        });
    }
});

// Touch Controls
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState.playerCells.length > 0 && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        const targetX = gameState.camera.x + (touchX - canvas.width / 2);
        const targetY = gameState.camera.y + (touchY - canvas.height / 2);
        
        gameState.playerCells.forEach(cell => {
            cell.targetX = targetX;
            cell.targetY = targetY;
        });
    }
});

// Split on Spacebar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.player) {
        const now = Date.now();
        // Check if any player cell is large enough to split
        const canSplit = gameState.playerCells.some(cell => 
            cell.mass >= CONFIG.MIN_SPLIT_SIZE * 2
        );
        if (canSplit && now - gameState.lastSplitTime > CONFIG.SPLIT_COOLDOWN) {
            splitPlayer();
            gameState.lastSplitTime = now;
        }
    }
});

function splitPlayer() {
    // Find the largest player cell to split
    const playerToSplit = gameState.playerCells.reduce((largest, cell) => 
        cell.mass > largest.mass ? cell : largest
    );
    
    if (playerToSplit.mass < CONFIG.MIN_SPLIT_SIZE * 2) return;
    
    const newSize = playerToSplit.mass / 2;
    
    // Create new cell
    const angle = Math.atan2(playerToSplit.targetY - playerToSplit.y, 
                             playerToSplit.targetX - playerToSplit.x);
    const newCell = new Cell(
        playerToSplit.x + Math.cos(angle) * playerToSplit.size * 2,
        playerToSplit.y + Math.sin(angle) * playerToSplit.size * 2,
        newSize,
        playerToSplit.color,
        true
    );
    newCell.mass = newSize;
    newCell.name = 'You';
    newCell.targetX = playerToSplit.targetX;
    newCell.targetY = playerToSplit.targetY;
    
    // Update original cell
    playerToSplit.mass = newSize;
    playerToSplit.size = Math.sqrt(newSize) * 2;
    
    // Add to player cells array
    gameState.playerCells.push(newCell);
    
    // Update main player reference to largest cell
    gameState.player = gameState.playerCells.reduce((largest, cell) => 
        cell.mass > largest.mass ? cell : largest
    );
}

// Collision Detection and Eating
function checkCollisions() {
    const allCells = [...gameState.playerCells, ...gameState.bots, ...gameState.food].filter(c => c);
    
    for (let i = 0; i < allCells.length; i++) {
        for (let j = i + 1; j < allCells.length; j++) {
            const cell1 = allCells[i];
            const cell2 = allCells[j];
            
            // Don't check collisions between player cells
            if (cell1.isPlayer && cell2.isPlayer) continue;
            
            if (cell1.canEat(cell2)) {
                cell1.mass += cell2.mass;
                cell1.size = Math.sqrt(cell1.mass) * 2;
                
                // Remove eaten cell
                if (cell2.isPlayer && gameState.playerCells.includes(cell2)) {
                    const index = gameState.playerCells.indexOf(cell2);
                    gameState.playerCells.splice(index, 1);
                    // If all player cells are eaten, restart
                    if (gameState.playerCells.length === 0) {
                        initPlayer();
                        initFood();
                        initBots();
                        return;
                    }
                    // Update main player reference
                    gameState.player = gameState.playerCells.reduce((largest, cell) => 
                        cell.mass > largest.mass ? cell : largest
                    );
                } else if (gameState.food.includes(cell2)) {
                    const index = gameState.food.indexOf(cell2);
                    gameState.food.splice(index, 1);
                    // Add new food
                    const size = random(CONFIG.MIN_FOOD_SIZE, CONFIG.MAX_FOOD_SIZE);
                    gameState.food.push(new Cell(
                        random(size, CONFIG.WORLD_SIZE - size),
                        random(size, CONFIG.WORLD_SIZE - size),
                        size,
                        randomColor()
                    ));
                } else if (gameState.bots.includes(cell2)) {
                    const index = gameState.bots.indexOf(cell2);
                    gameState.bots.splice(index, 1);
                    // Respawn bot
                    const size = random(CONFIG.MIN_BOT_SIZE, CONFIG.MAX_BOT_SIZE);
                    const bot = new Cell(
                        random(size, CONFIG.WORLD_SIZE - size),
                        random(size, CONFIG.WORLD_SIZE - size),
                        size,
                        randomColor(),
                        false,
                        true
                    );
                    gameState.bots.push(bot);
                }
            } else if (cell2.canEat(cell1)) {
                // Same logic but reversed
                cell2.mass += cell1.mass;
                cell2.size = Math.sqrt(cell2.mass) * 2;
                
                if (cell1.isPlayer && gameState.playerCells.includes(cell1)) {
                    const index = gameState.playerCells.indexOf(cell1);
                    gameState.playerCells.splice(index, 1);
                    if (gameState.playerCells.length === 0) {
                        initPlayer();
                        initFood();
                        initBots();
                        return;
                    }
                    gameState.player = gameState.playerCells.reduce((largest, cell) => 
                        cell.mass > largest.mass ? cell : largest
                    );
                } else if (gameState.food.includes(cell1)) {
                    const index = gameState.food.indexOf(cell1);
                    gameState.food.splice(index, 1);
                    const size = random(CONFIG.MIN_FOOD_SIZE, CONFIG.MAX_FOOD_SIZE);
                    gameState.food.push(new Cell(
                        random(size, CONFIG.WORLD_SIZE - size),
                        random(size, CONFIG.WORLD_SIZE - size),
                        size,
                        randomColor()
                    ));
                } else if (gameState.bots.includes(cell1)) {
                    const index = gameState.bots.indexOf(cell1);
                    gameState.bots.splice(index, 1);
                    const size = random(CONFIG.MIN_BOT_SIZE, CONFIG.MAX_BOT_SIZE);
                    const bot = new Cell(
                        random(size, CONFIG.WORLD_SIZE - size),
                        random(size, CONFIG.WORLD_SIZE - size),
                        size,
                        randomColor(),
                        false,
                        true
                    );
                    gameState.bots.push(bot);
                }
            }
        }
    }
}

// Bot AI
function updateBots() {
    gameState.bots.forEach(bot => {
        if (!bot.isBot) return;
        
        // Check for threats (larger cells that can eat this bot)
        let threat = null;
        const allCells = [...gameState.playerCells, ...gameState.bots].filter(c => c && c !== bot);
        allCells.forEach(cell => {
            if (cell.mass > bot.mass * 1.2) {
                const dist = distance(bot.x, bot.y, cell.x, cell.y);
                if (dist < 200) {
                    threat = cell;
                }
            }
        });
        
        if (threat) {
            // Run away from threats
            const angle = Math.atan2(bot.y - threat.y, bot.x - threat.x);
            bot.targetX = bot.x + Math.cos(angle) * 100;
            bot.targetY = bot.y + Math.sin(angle) * 100;
        } else if (gameState.player) {
            // Move towards the player
            bot.targetX = gameState.player.x;
            bot.targetY = gameState.player.y;
        } else if (gameState.playerCells.length > 0) {
            // If no main player, move towards the largest player cell
            const largestPlayer = gameState.playerCells.reduce((largest, cell) => 
                cell.mass > largest.mass ? cell : largest
            );
            bot.targetX = largestPlayer.x;
            bot.targetY = largestPlayer.y;
        } else {
            // Random movement as fallback
            if (Math.random() < 0.02) {
                bot.targetX = bot.x + random(-200, 200);
                bot.targetY = bot.y + random(-200, 200);
            }
        }
        
        bot.update();
    });
}

// Update Leaderboard
function updateLeaderboard() {
    const allCells = [...gameState.playerCells, ...gameState.bots].filter(c => c);
    allCells.sort((a, b) => b.mass - a.mass);
    
    gameState.leaderboard = allCells.slice(0, 10);
    
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    gameState.leaderboard.forEach((cell, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item' + (cell.isPlayer ? ' player' : '');
        item.textContent = `${index + 1}. ${cell.name || 'Cell'}: ${Math.floor(cell.mass)}`;
        leaderboardList.appendChild(item);
    });
}

// Update Score Display
function updateScore() {
    if (gameState.playerCells.length > 0) {
        // Show total mass of all player cells
        const totalMass = gameState.playerCells.reduce((sum, cell) => sum + cell.mass, 0);
        document.getElementById('player-mass').textContent = Math.floor(totalMass);
    }
}

// Draw Grid Background
function drawGrid() {
    const gridSize = 50;
    const startX = -(gameState.camera.x % gridSize) - gridSize;
    const startY = -(gameState.camera.y % gridSize) - gridSize;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = startX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = startY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Main Game Loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Update game state
    gameState.playerCells.forEach(cell => cell.update());
    updateCamera();
    updateBots();
    checkCollisions();
    updateLeaderboard();
    updateScore();
    
    // Draw everything
    const cameraX = gameState.camera.x;
    const cameraY = gameState.camera.y;
    
    // Draw food
    gameState.food.forEach(food => food.draw(cameraX, cameraY));
    
    // Draw bots
    gameState.bots.forEach(bot => bot.draw(cameraX, cameraY));
    
    // Draw player cells
    gameState.playerCells.forEach(cell => cell.draw(cameraX, cameraY));
    
    requestAnimationFrame(gameLoop);
}

// Initialize Game
function init() {
    initPlayer();
    initFood();
    initBots();
    gameLoop();
}

// Start the game
init();

