# Three.js Game Project

This is a 3D game project built with Three.js featuring an island surrounded by animated water and a 2D character that can move in 8 directions.

## Project Structure

The project follows a modular architecture for better organization and maintainability:

```
/
├── index.html      # Main HTML file
├── css/
│   └── style.css   # Stylesheet
├── assets/
│   └── textures/   # Game textures
└── js/
    ├── main.js     # Entry point
    ├── core/
    │   └── Game.js   # Main game engine
    ├── entities/
    │   ├── Water.js  # Water plane with animation
    │   ├── Island.js # Island made of cubes
    │   └── Character.js # Player character
    ├── controls/
    │   └── InputController.js # Keyboard and touch controls
    └── utils/
        └── (future utility functions)
```

## Game Features

- **Animated Water**: A plane with animated wave effect
- **Island**: A 10x10 grid of cubes with different materials (grass, sand, dirt)
- **Character**: A 2D face that always faces the camera (billboard technique)
- **Controls**: 8-direction movement using keyboard (WASD/Arrow keys) or virtual joystick on mobile
- **Camera**: Angled top-down view with orbit controls

## Getting Started

To run the project, you need to serve the files using a local web server. This is necessary because JavaScript modules require proper CORS handling.

```bash
# Using npm and Vite
npm install
npm start
```

Or if you have Python installed:

```bash
# Python 3
python -m http.server
```

## Controls

- **Keyboard**: Use WASD or Arrow keys to move the character
- **Mobile**: Use the virtual joystick that appears on touch devices
- **Camera**: Click and drag to rotate the camera view

## Next Steps

- Add game objectives and mechanics
- Implement physics for more realistic movement
- Add collectible items on the island
- Create enemies or obstacles
- Add sound effects and background music
- Implement a scoring system
