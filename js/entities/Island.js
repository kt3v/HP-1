import * as THREE from 'three';

class Island {
    constructor(targetCubeCount = 100, cubeSize = 1) {
        this.targetCubeCount = targetCubeCount;
        this.cubeSize = cubeSize;
        this.cubes = [];
        
        // Create materials
        this.materials = {
            surface: new THREE.MeshStandardMaterial({ color: 0xFFFF00 }), // Yellow
            dirt: new THREE.MeshStandardMaterial({ color: 0x8b4513 }) // Brown
        };
        
        // Create geometry
        this.cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // Build the island
        this.buildIsland();
    }
    
    buildIsland() {
        // Simply create a 10x10 grid and then add random cubes until we reach 100
        // This is the most direct approach to ensure we get exactly 100 cubes
        
        // Create a grid large enough to hold our island
        const gridSize = 20; // Large enough for 100 cubes with some randomness
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
        const centerPoint = Math.floor(gridSize / 2);
        let placedCount = 0;
        
        // First, create a small solid center (3x3 square)
        for (let x = centerPoint - 1; x <= centerPoint + 1; x++) {
            for (let z = centerPoint - 1; z <= centerPoint + 1; z++) {
                grid[x][z] = true;
                placedCount++;
            }
        }
        
        console.log(`Starting with ${placedCount} cubes in center`);
        
        // Now add the rest of the cubes using a growth algorithm
        // We'll keep track of the frontier (empty cells adjacent to filled cells)
        let frontier = [];
        
        // Initialize the frontier
        this.updateFrontier(grid, frontier, gridSize);
        
        // Keep adding cubes until we reach exactly 100
        while (placedCount < this.targetCubeCount && frontier.length > 0) {
            // Pick a random position from the frontier
            const randomIndex = Math.floor(Math.random() * frontier.length);
            const pos = frontier[randomIndex];
            
            // Place a cube here
            grid[pos.x][pos.z] = true;
            placedCount++;
            
            // Remove this position from the frontier
            frontier.splice(randomIndex, 1);
            
            // Update the frontier with new positions
            this.updateFrontier(grid, frontier, gridSize);
        }
        
        // If we still don't have enough cubes (which shouldn't happen with this approach)
        // Just fill in a spiral pattern until we reach 100
        if (placedCount < this.targetCubeCount) {
            console.log(`Still need ${this.targetCubeCount - placedCount} more cubes`);
            
            const directions = [
                {dx: 1, dz: 0},   // right
                {dx: 0, dz: 1},   // down
                {dx: -1, dz: 0},  // left
                {dx: 0, dz: -1}   // up
            ];
            
            let x = centerPoint;
            let z = centerPoint;
            let dirIndex = 0;
            let stepsInThisDirection = 1;
            let stepsTaken = 0;
            let turnCount = 0;
            
            while (placedCount < this.targetCubeCount) {
                // Move in the current direction
                x += directions[dirIndex].dx;
                z += directions[dirIndex].dz;
                
                // Check if we're still in bounds
                if (x >= 0 && x < gridSize && z >= 0 && z < gridSize) {
                    // If this cell is empty, place a cube
                    if (!grid[x][z]) {
                        grid[x][z] = true;
                        placedCount++;
                    }
                }
                
                // Check if we need to change direction
                stepsTaken++;
                if (stepsTaken === stepsInThisDirection) {
                    dirIndex = (dirIndex + 1) % 4;
                    stepsTaken = 0;
                    turnCount++;
                    
                    // After every two turns, increase the steps
                    if (turnCount % 2 === 0) {
                        stepsInThisDirection++;
                    }
                }
            }
        }
        
        console.log(`Created island with ${placedCount} cubes`);
        
        // Convert the grid to actual 3D cubes
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (grid[x][z]) {
                    // Create the main cube (top) - yellow
                    const cube = new THREE.Mesh(
                        this.cubeGeometry,
                        this.materials.surface
                    );
                    
                    // Position the cube (centered around origin)
                    cube.position.x = (x - centerPoint) * this.cubeSize;
                    cube.position.z = (z - centerPoint) * this.cubeSize;
                    cube.position.y = 0;
                    
                    cube.castShadow = true;
                    cube.receiveShadow = true;
                    this.cubes.push(cube);
                    
                    // Add dirt cube below
                    const dirtCube = new THREE.Mesh(this.cubeGeometry, this.materials.dirt);
                    dirtCube.position.x = cube.position.x;
                    dirtCube.position.z = cube.position.z;
                    dirtCube.position.y = -this.cubeSize;
                    dirtCube.castShadow = false;
                    dirtCube.receiveShadow = false;
                    this.cubes.push(dirtCube);
                }
            }
        }
    }
    
    // Helper method to check if a position has an adjacent cube
    hasAdjacentCube(grid, x, z) {
        const gridSize = grid.length;
        const directions = [
            {dx: 1, dz: 0},   // right
            {dx: -1, dz: 0},  // left
            {dx: 0, dz: 1},   // down
            {dx: 0, dz: -1}   // up
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newZ = z + dir.dz;
            
            if (newX >= 0 && newX < gridSize && newZ >= 0 && newZ < gridSize) {
                if (grid[newX][newZ]) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Helper method to update the frontier positions
    updateFrontier(grid, frontier, gridSize) {
        // Clear the current frontier
        frontier.length = 0;
        
        // Find all empty cells that are adjacent to filled cells
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (!grid[x][z]) { // If this cell is empty
                    // Check if it's adjacent to a filled cell
                    if (this.hasAdjacentCube(grid, x, z)) {
                        frontier.push({x, z});
                    }
                }
            }
        }
    }
    
    // Helper method to add new frontier positions
    addNewFrontierPositions(grid, frontierPositions, x, z) {
        const gridSize = grid.length;
        const directions = [
            {dx: 1, dz: 0},   // right
            {dx: -1, dz: 0},  // left
            {dx: 0, dz: 1},   // down
            {dx: 0, dz: -1}   // up
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newZ = z + dir.dz;
            
            if (newX >= 0 && newX < gridSize && newZ >= 0 && newZ < gridSize) {
                // If this cell is empty and not already in frontier
                if (!grid[newX][newZ]) {
                    // Check if it's not already in the frontier list
                    const alreadyInFrontier = frontierPositions.some(pos => 
                        pos.x === newX && pos.z === newZ
                    );
                    
                    if (!alreadyInFrontier) {
                        frontierPositions.push({x: newX, z: newZ});
                    }
                }
            }
        }
    }
    
    addToScene(scene) {
        this.cubes.forEach(cube => {
            scene.add(cube);
        });
    }
    
    // Get the radius of the island (for collision detection)
    getRadius() {
        // Calculate radius based on the square root of the target cube count
        // This is an approximation that works well for our randomly generated island
        return Math.sqrt(this.targetCubeCount) * this.cubeSize;
    }
}

export { Island };
