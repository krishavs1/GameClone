# Agar.io Clone

A complete browser-based implementation of the popular agar.io game.

## Features

- **Player Control**: Move your cell by moving your mouse cursor
- **Food System**: Eat food particles scattered across the map to grow
- **AI Bots**: Compete against intelligent bots that hunt for food and avoid larger cells
- **Collision Detection**: Eat smaller cells (must be 20% larger) and avoid being eaten
- **Camera System**: Smooth camera that follows your cell
- **Leaderboard**: Real-time ranking of all cells by mass
- **Split Mechanic**: Press Spacebar to split your cell (when mass >= 70, 30s cooldown)
- **Touch Controls**: Works on mobile devices with touch support

## How to Play

1. Open `index.html` in a modern web browser
2. Move your mouse to control your cell
3. Eat food particles (small colored circles) to grow larger
4. Eat smaller cells to gain their mass
5. Avoid larger cells or you'll be eaten and respawn
6. Press Spacebar to split your cell when you're large enough

## Game Mechanics

- **Size = Power**: Larger cells can eat smaller ones
- **Speed Penalty**: Larger cells move slower
- **Mass System**: Your size is based on your mass (size = √mass × 2)
- **Eating Rule**: You must be at least 20% larger than a cell to eat it
- **World Size**: 5000×5000 unit world with 500 food particles and 20 AI bots

## Technical Details

- Pure JavaScript (no dependencies)
- HTML5 Canvas for rendering
- RequestAnimationFrame for smooth 60fps gameplay
- Responsive design that adapts to window size

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript features
- RequestAnimationFrame API

Enjoy the game!

# GameClone
