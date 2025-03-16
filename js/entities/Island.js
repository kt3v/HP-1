import * as THREE from 'three';

class Island {
    constructor(targetCubeCount = 100, cubeSize = 1) {
        this.targetCubeCount = targetCubeCount;
        this.cubeSize = cubeSize;
        this.cubes = [];
        this.secondLayerRatio = 0.5; // Ratio of second layer cubes to first layer cubes
        
        // Create materials
        this.materials = {
            surface: new THREE.MeshStandardMaterial({ color: 0xFFEA00 }), // Yellow
            dirt: new THREE.MeshStandardMaterial({ color: 0x8b4513 }) // Brown
        };
        
        // Create geometry
        this.cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // Build the island
        this.buildIsland();
    }
    
    buildIsland() {
        // Create a grid large enough to hold our island
        const gridSize = 25; // Larger grid for more smooth oval shape
        const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
        const centerPoint = Math.floor(gridSize / 2);
        let placedCount = 0;
        
        // Define oval parameters
        const radiusX = Math.sqrt(this.targetCubeCount / Math.PI) * 1.2; // Horizontal radius (slightly larger)
        const radiusZ = Math.sqrt(this.targetCubeCount / Math.PI) * 0.8; // Vertical radius (slightly smaller)
        
        // First, create an oval-like shape using the ellipse equation: (x/a)² + (z/b)² <= 1
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Calculate normalized distance from center point
                const normalizedX = (x - centerPoint) / radiusX;
                const normalizedZ = (z - centerPoint) / radiusZ;
                
                // Check if this point is within our oval
                // Add some randomness to the edge to make it less perfect
                const distanceFromEdge = 1 - (normalizedX * normalizedX + normalizedZ * normalizedZ);
                
                // Points well inside the oval
                if (distanceFromEdge > 0.2) {
                    grid[x][z] = true;
                    placedCount++;
                } 
                // Points near the edge - add some randomness
                else if (distanceFromEdge > 0 && distanceFromEdge <= 0.2) {
                    // Higher probability of placing a cube the closer we are to the center
                    const probability = distanceFromEdge * 5; // 0 at the edge, 1 at distanceFromEdge = 0.2
                    if (Math.random() < probability) {
                        grid[x][z] = true;
                        placedCount++;
                    }
                }
                
                // Stop if we've reached our target
                if (placedCount >= this.targetCubeCount) {
                    break;
                }
            }
            
            // Stop if we've reached our target
            if (placedCount >= this.targetCubeCount) {
                break;
            }
        }
        
        console.log(`Created ${placedCount} cubes in initial oval shape`);
        
        // If we have too many cubes, remove some from the edges
        if (placedCount > this.targetCubeCount) {
            // Find edge cubes (cubes with at least one empty neighbor)
            const edgeCubes = [];
            for (let x = 0; x < gridSize; x++) {
                for (let z = 0; z < gridSize; z++) {
                    if (grid[x][z] && this.hasEmptyNeighbor(grid, x, z, gridSize)) {
                        edgeCubes.push({x, z});
                    }
                }
            }
            
            // Shuffle the edge cubes
            for (let i = edgeCubes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [edgeCubes[i], edgeCubes[j]] = [edgeCubes[j], edgeCubes[i]];
            }
            
            // Remove cubes until we reach the target count
            let i = 0;
            while (placedCount > this.targetCubeCount && i < edgeCubes.length) {
                const pos = edgeCubes[i];
                
                // Only remove if it wouldn't create a hole
                if (!this.wouldCreateHoleByRemoving(grid, pos.x, pos.z, gridSize)) {
                    grid[pos.x][pos.z] = false;
                    placedCount--;
                }
                
                i++;
            }
        }
        // If we don't have enough cubes, add more at the edges
        else if (placedCount < this.targetCubeCount) {
            // Create a frontier of empty cells adjacent to filled cells
            let frontier = [];
            this.updateFrontier(grid, frontier, gridSize);
            
            // Add cubes until we reach the target count
            while (placedCount < this.targetCubeCount && frontier.length > 0) {
                // Pick a random position from the frontier
                const randomIndex = Math.floor(Math.random() * frontier.length);
                const pos = frontier[randomIndex];
                
                // Remove this position from frontier
                frontier.splice(randomIndex, 1);
                
                // Check if placing a cube here would maintain the oval shape
                const normalizedX = (pos.x - centerPoint) / radiusX;
                const normalizedZ = (pos.z - centerPoint) / radiusZ;
                const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);
                
                // Only place cubes that are reasonably close to our desired oval shape
                if (distanceFromCenter <= 1.2) {
                    grid[pos.x][pos.z] = true;
                    placedCount++;
                    
                    // Update the frontier with new positions
                    this.updateFrontier(grid, frontier, gridSize);
                }
            }
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
        
        // Create a second layer of blocks
        // We'll use a smaller area for the second layer (inner part of the island)
        const secondLayerGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(false));
        const secondLayerCount = Math.floor(this.targetCubeCount * this.secondLayerRatio);
        let secondLayerPlaced = 0;
        
        // Find potential positions for second layer (must be on top of first layer and not at edges)
        const potentialSecondLayerPositions = [];
        
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (grid[x][z]) {
                    // Check if this is not at the edge (has no empty neighbors)
                    if (!this.hasEmptyNeighbor(grid, x, z, gridSize)) {
                        potentialSecondLayerPositions.push({x, z});
                    }
                }
            }
        }
        
        // Sort positions by distance from center (prioritize center positions)
        potentialSecondLayerPositions.sort((a, b) => {
            const distA = Math.pow(a.x - centerPoint, 2) + Math.pow(a.z - centerPoint, 2);
            const distB = Math.pow(b.x - centerPoint, 2) + Math.pow(b.z - centerPoint, 2);
            return distA - distB;
        });
        
        // Place second layer blocks starting from center, up to our target count
        for (const pos of potentialSecondLayerPositions) {
            if (secondLayerPlaced >= secondLayerCount) break;
            
            secondLayerGrid[pos.x][pos.z] = true;
            secondLayerPlaced++;
        }
        
        console.log(`Added ${secondLayerPlaced} blocks to second layer`);
        
        // Convert the grid to actual 3D cubes
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // First layer cubes
                if (grid[x][z]) {
                    // Create the main cube - yellow if no second layer above, dirt if second layer above
                    const cube = new THREE.Mesh(
                        this.cubeGeometry,
                        secondLayerGrid[x][z] ? this.materials.dirt : this.materials.surface
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
                
                // Second layer cubes
                if (secondLayerGrid[x][z]) {
                    // Create second layer cube (always yellow surface)
                    const secondLayerCube = new THREE.Mesh(
                        this.cubeGeometry,
                        this.materials.surface
                    );
                    
                    // Position one cube higher than the first layer
                    secondLayerCube.position.x = (x - centerPoint) * this.cubeSize;
                    secondLayerCube.position.z = (z - centerPoint) * this.cubeSize;
                    secondLayerCube.position.y = this.cubeSize;
                    
                    secondLayerCube.castShadow = true;
                    secondLayerCube.receiveShadow = true;
                    this.cubes.push(secondLayerCube);
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
    
    // Check if a position has at least one empty neighbor
    hasEmptyNeighbor(grid, x, z, gridSize) {
        const directions = [
            {dx: 1, dz: 0},   // right
            {dx: -1, dz: 0},  // left
            {dx: 0, dz: 1},   // down
            {dx: 0, dz: -1},  // up
            {dx: 1, dz: 1},   // diagonal down-right
            {dx: -1, dz: 1},  // diagonal down-left
            {dx: 1, dz: -1},  // diagonal up-right
            {dx: -1, dz: -1}  // diagonal up-left
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newZ = z + dir.dz;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= gridSize || newZ < 0 || newZ >= gridSize) continue;
            
            // If this neighbor is empty, return true
            if (!grid[newX][newZ]) {
                return true;
            }
        }
        
        // No empty neighbors found
        return false;
    }
    
    // Check if removing a cube at (x,z) would create a hole
    wouldCreateHoleByRemoving(grid, x, z, gridSize) {
        // If this position is already empty, it can't create a hole
        if (!grid[x][z]) return false;
        
        // Temporarily remove the cube at this position
        grid[x][z] = false;
        
        // Check if removing this cube would disconnect any adjacent cubes
        const directions = [
            {dx: 1, dz: 0},   // right
            {dx: -1, dz: 0},  // left
            {dx: 0, dz: 1},   // down
            {dx: 0, dz: -1},  // up
            {dx: 1, dz: 1},   // diagonal down-right
            {dx: -1, dz: 1},  // diagonal down-left
            {dx: 1, dz: -1},  // diagonal up-right
            {dx: -1, dz: -1}  // diagonal up-left
        ];
        
        // Find all filled neighbors
        const filledNeighbors = [];
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newZ = z + dir.dz;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= gridSize || newZ < 0 || newZ >= gridSize) continue;
            
            // If this neighbor is filled, add it to our list
            if (grid[newX][newZ]) {
                filledNeighbors.push({x: newX, z: newZ});
            }
        }
        
        // If there are 0 or 1 filled neighbors, removing this cube won't create a hole
        if (filledNeighbors.length <= 1) {
            grid[x][z] = true; // Restore the cube
            return false;
        }
        
        // Check if all filled neighbors are connected to each other
        // We'll use a flood fill algorithm starting from the first filled neighbor
        const visited = new Set();
        const floodFill = (pos) => {
            const key = `${pos.x},${pos.z}`;
            if (visited.has(key)) return;
            
            visited.add(key);
            
            // Check all neighbors of this position
            for (const dir of directions) {
                const newX = pos.x + dir.dx;
                const newZ = pos.z + dir.dz;
                
                // Skip if out of bounds or if it's the position we're checking
                if (newX < 0 || newX >= gridSize || newZ < 0 || newZ >= gridSize) continue;
                if (newX === x && newZ === z) continue;
                
                // If this neighbor is filled, visit it
                if (grid[newX][newZ]) {
                    floodFill({x: newX, z: newZ});
                }
            }
        };
        
        // Start flood fill from the first filled neighbor
        floodFill(filledNeighbors[0]);
        
        // If all filled neighbors were visited, they're all connected
        const allConnected = filledNeighbors.every(pos => {
            const key = `${pos.x},${pos.z}`;
            return visited.has(key);
        });
        
        // Restore the cube
        grid[x][z] = true;
        
        // If not all filled neighbors are connected, removing this cube would create a hole
        return !allConnected;
    }
    
    // Check if placing a cube at (x,z) would create a hole
    wouldCreateHole(grid, x, z, gridSize) {
        // If this position already has a cube, it can't create a hole
        if (grid[x][z]) return false;
        
        // Temporarily place a cube at this position
        grid[x][z] = true;
        
        // Check for potential holes (empty cells surrounded by filled cells)
        const potentialHoles = [];
        
        // Check the 8 surrounding positions for empty cells
        const directions = [
            {dx: 1, dz: 0},   // right
            {dx: -1, dz: 0},  // left
            {dx: 0, dz: 1},   // down
            {dx: 0, dz: -1},  // up
            {dx: 1, dz: 1},   // diagonal down-right
            {dx: -1, dz: 1},  // diagonal down-left
            {dx: 1, dz: -1},  // diagonal up-right
            {dx: -1, dz: -1}  // diagonal up-left
        ];
        
        // Check each adjacent cell
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newZ = z + dir.dz;
            
            // Skip if out of bounds
            if (newX < 0 || newX >= gridSize || newZ < 0 || newZ >= gridSize) continue;
            
            // If this adjacent cell is empty, check if it would become a hole
            if (!grid[newX][newZ]) {
                // Count how many filled neighbors this empty cell has
                let filledNeighbors = 0;
                let totalValidNeighbors = 0;
                
                for (const neighborDir of directions) {
                    const neighborX = newX + neighborDir.dx;
                    const neighborZ = newZ + neighborDir.dz;
                    
                    // Skip if out of bounds
                    if (neighborX < 0 || neighborX >= gridSize || neighborZ < 0 || neighborZ >= gridSize) continue;
                    
                    totalValidNeighbors++;
                    if (grid[neighborX][neighborZ]) {
                        filledNeighbors++;
                    }
                }
                
                // If this empty cell has 7 or 8 filled neighbors (out of 8 possible),
                // it would become a hole
                if (filledNeighbors >= 7 && filledNeighbors === totalValidNeighbors - 1) {
                    // Remove the temporary cube
                    grid[x][z] = false;
                    return true;
                }
            }
        }
        
        // Remove the temporary cube
        grid[x][z] = false;
        
        // No holes would be created
        return false;
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
