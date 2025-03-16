import * as THREE from 'three';

class Character {
    constructor() {
        this.speed = 0.05;
        this.movementDirection = new THREE.Vector3(0, 0, 0);
        
        // Height adjustment properties
        this.targetHeight = 2; // Default height above terrain
        this.verticalSpeed = 0.05; // Speed of vertical adjustment
        this.waterLevel = -0.2; // Same as in Water.js
        this.defaultHeightAboveTerrain = 1.0; // Default height above terrain
        
        // Debug text element
        this.createDebugText();
        
        // Create a 2D face in 3D space (billboard technique)
        this.createMesh();
    }
    
    createDebugText() {
        // Create debug text element
        this.debugElement = document.createElement('div');
        this.debugElement.style.position = 'absolute';
        this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugElement.style.color = 'white';
        this.debugElement.style.padding = '5px';
        this.debugElement.style.borderRadius = '3px';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.fontSize = '12px';
        this.debugElement.style.pointerEvents = 'none'; // Don't interfere with mouse events
        this.debugElement.style.zIndex = '1000';
        this.debugElement.textContent = 'Height: 0';
        
        // Add to document
        document.body.appendChild(this.debugElement);
    }
    
    createMesh() {
        const geometry = new THREE.PlaneGeometry(1.5, 1.5);
        
        // Create a canvas for the face with transparency
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Clear the canvas with full transparency
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a simple face on the canvas with clean edges
        context.fillStyle = '#FFD700'; // Yellow face
        context.beginPath();
        context.arc(128, 128, 120, 0, Math.PI * 2); // Circle for face
        context.fill();
        
        // Eyes
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(90, 100, 15, 0, Math.PI * 2); // Left eye
        context.arc(166, 100, 15, 0, Math.PI * 2); // Right eye
        context.fill();
        
        // Smile
        context.beginPath();
        context.arc(128, 140, 50, 0, Math.PI);
        context.stroke();
        
        // Create texture from canvas with improved settings
        const texture = new THREE.CanvasTexture(canvas);
        texture.premultiplyAlpha = true; // Fix transparency edge artifacts
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5, // Higher threshold to discard semi-transparent pixels
            depthTest: true,
            depthWrite: true, // Enable depth writing
            renderOrder: 1 // Ensure character renders after water
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 2, 0); // Position higher above the water level
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        this.mesh.renderOrder = 10; // Ensure character always renders on top
        this.mesh.material.polygonOffset = true;
        this.mesh.material.polygonOffsetFactor = -1; // Move the character forward in depth
    }
    
    move(direction) {
        this.movementDirection.copy(direction);
    }
    
    // Check if character is over island or water and get appropriate height
    getTerrainHeightAt(position, island) {
        // Default to water level if no island is provided
        if (!island) return this.waterLevel;
        
        // We'll check if the character is directly above any island cube
        // This is more precise than using a simple radius check
        
        // Get all cubes from the island
        const islandCubes = island.cubes;
        const cubeSize = island.cubeSize;
        const characterX = position.x;
        const characterZ = position.z;
        
        // Check if character is above any cube
        let onSecondLayer = false;
        let onFirstLayer = false;
        
        for (const cube of islandCubes) {
            // Get cube position
            const cubeX = cube.position.x;
            const cubeZ = cube.position.z;
            const cubeY = cube.position.y;
            
            // Calculate horizontal distance from character to cube center
            const dx = Math.abs(characterX - cubeX);
            const dz = Math.abs(characterZ - cubeZ);
            
            // Check if character is within cube boundaries (with a small margin)
            // Half cube size is used because position is at center of cube
            const halfCubeSize = cubeSize / 2;
            const margin = 0.1; // Small margin to avoid edge cases
            
            if (dx <= halfCubeSize + margin && dz <= halfCubeSize + margin) {
                // Character is above this cube
                if (cubeY > 0) {
                    // This is a second layer cube
                    onSecondLayer = true;
                    break; // Second layer takes precedence
                } else if (cubeY === 0) {
                    // This is a first layer cube
                    onFirstLayer = true;
                    // Don't break, continue checking for second layer cubes
                }
            }
        }
        
        // Return appropriate height based on which layer we're on
        if (onSecondLayer) {
            return 1.0; // Second layer height
        } else if (onFirstLayer) {
            return 0.0; // First layer height
        } else {
            return this.waterLevel; // Not on any island cube, so we're over water
        }
    }
    
    update(deltaTime, camera, island) {
        // Move character horizontally
        if (this.movementDirection.length() > 0) {
            this.mesh.position.x += this.movementDirection.x * this.speed;
            this.mesh.position.z += this.movementDirection.z * this.speed;
            
            // No boundary restriction - character can move freely
        }
        
        // Always adjust height based on terrain, even if we're over water
        // Get terrain height at current position
        const terrainHeight = island ? this.getTerrainHeightAt(this.mesh.position, island) : this.waterLevel;
        
        // Set target height above terrain (or water)
        this.targetHeight = terrainHeight + this.defaultHeightAboveTerrain;
        
        // Smoothly adjust to target height
        if (Math.abs(this.mesh.position.y - this.targetHeight) > 0.01) {
            if (this.mesh.position.y < this.targetHeight) {
                this.mesh.position.y += this.verticalSpeed * deltaTime * 60;
                if (this.mesh.position.y > this.targetHeight) {
                    this.mesh.position.y = this.targetHeight;
                }
            } else {
                this.mesh.position.y -= this.verticalSpeed * deltaTime * 60;
                if (this.mesh.position.y < this.targetHeight) {
                    this.mesh.position.y = this.targetHeight;
                }
            }
        }
        
        // Update debug text with current height information
        this.updateDebugText(terrainHeight, camera);
        
        // Make the character always face the camera (billboard technique)
        if (camera) {
            const cameraDirection = new THREE.Vector3();
            // Check if camera is a THREE.Camera or our Camera controller
            if (camera.isCamera) {
                camera.getWorldDirection(cameraDirection);
            } else if (camera.getCamera) {
                // If it's our Camera controller, get the THREE.js camera
                camera.getCamera().getWorldDirection(cameraDirection);
            }
            
            cameraDirection.y = 0; // Keep character upright
            this.mesh.lookAt(
                this.mesh.position.x - cameraDirection.x,
                this.mesh.position.y,
                this.mesh.position.z - cameraDirection.z
            );
        }
    }
    // Update debug text position and content
    updateDebugText(terrainHeight, camera) {
        if (!this.debugElement || !camera) return;
        
        // Get screen position for the character
        const vector = new THREE.Vector3();
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;
        
        // Get position above the character's head
        vector.copy(this.mesh.position);
        vector.y += 1.5; // Position above the character's head
        
        // Get the actual THREE.js camera object
        const threeCamera = camera.isCamera ? camera : (camera.getCamera ? camera.getCamera() : null);
        if (!threeCamera) return;
        
        // Project 3D position to 2D screen space
        vector.project(threeCamera);
        
        // Convert to CSS coordinates
        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = -(vector.y * heightHalf) + heightHalf;
        
        // Update debug element position
        this.debugElement.style.left = vector.x + 'px';
        this.debugElement.style.top = vector.y + 'px';
        
        // Update text content with height information
        const terrainType = terrainHeight === this.waterLevel ? 'Water' : 
                           terrainHeight === 0 ? 'Ground (L1)' : 'Ground (L2)';
        
        this.debugElement.textContent = `Height: ${this.mesh.position.y.toFixed(2)}
` + 
                                      `Target: ${this.targetHeight.toFixed(2)}
` + 
                                      `Terrain: ${terrainHeight.toFixed(2)} (${terrainType})`;
    }
}

export { Character };
