# Three.js Game Project

This is a simple 3D game project built with Three.js.

## Project Structure

```
/
├── index.html      # Main HTML file
├── css/
│   └── style.css   # Stylesheet
└── js/
    └── main.js     # Main game logic
```

## Getting Started

To run the project, you need to serve the files using a local web server. This is necessary because JavaScript modules require proper CORS handling.

### Using a simple HTTP server

If you have Node.js installed, you can use a simple HTTP server like `http-server`:

```bash
npm install -g http-server
http-server
```

Or if you have Python installed:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

## Features

- 3D rendering with Three.js
- Orbit controls for camera manipulation
- Responsive design
- Basic game loop implementation

## Next Steps

- Add game mechanics
- Implement physics
- Create more complex 3D models
- Add user interface elements
- Implement game state management
