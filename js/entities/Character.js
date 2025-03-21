import * as THREE from 'three';
import { Raft } from './Raft.js';
import { debugController } from '../controls/DebugController.js';

class Character {
    constructor() {
        this.speed = 0.05;
        this.movementDirection = new THREE.Vector3(0, 0, 0);
        this.lastDirection = 'down'; // Default direction (down, up, left, right)
        
        // Height adjustment properties
        this.targetHeight = 2.0; // Увеличенная высота над землей
        this.verticalSpeed = 0.1; // Speed of vertical adjustment
        this.waterLevel = -0.1;
        this.defaultHeightAboveTerrain = 1.25; // Увеличенная высота над землей
        
        // Animation properties
        this.isMoving = false;
        this.currentFrame = 0;
        this.animationSpeed = 0.15; // Frames per second * deltaTime
        this.frameTime = 0;
        this.sprites = {
            idle: null,
            down: [],
            up: [],
            left: [],
            right: []
        };
        
        // Load all sprites
        this.loadSprites();
        
        // Debug text element
        this.createDebugText();
        
        // Create character mesh
        this.createMesh();
        
        // Create raft
        this.raft = new Raft();
        this.isOnWater = false; // Track if character is on water
        
        // Register with debug controller
        debugController.registerEntity(this);
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
    
    loadSprites() {
        const textureLoader = new THREE.TextureLoader();
        
        // Функция для применения NearestFilter к текстуре
        const loadPixelTexture = (path) => {
            const texture = textureLoader.load(path);
            texture.magFilter = THREE.NearestFilter; // Для увеличения (приближения)
            texture.minFilter = THREE.NearestFilter; // Для уменьшения (отдаления)
            return texture;
        };
        
        // Load idle sprite с NearestFilter
        this.sprites.idle = loadPixelTexture('assets/character/idle.png');
        
        // Правильное распределение спрайтов по направлениям
        // Down direction (sprites 0-5)
        for (let i = 0; i < 6; i++) {
            this.sprites.down.push(loadPixelTexture(`assets/character/walk/${i.toString().padStart(3, '0')}.png`));
        }
        
        // Left direction (sprites 6-11)
        for (let i = 6; i < 12; i++) {
            this.sprites.left.push(loadPixelTexture(`assets/character/walk/${i.toString().padStart(3, '0')}.png`));
        }
        
        // Right direction (sprites 12-17)
        for (let i = 12; i < 18; i++) {
            this.sprites.right.push(loadPixelTexture(`assets/character/walk/${i.toString().padStart(3, '0')}.png`));
        }
        
        // Up direction (sprites 18-23)
        for (let i = 18; i < 24; i++) {
            this.sprites.up.push(loadPixelTexture(`assets/character/walk/${i.toString().padStart(3, '0')}.png`));
        }
    }
    
    createMesh() {
        // Увеличенный размер персонажа (в 2 раза больше)
        const geometry = new THREE.PlaneGeometry(4, 4); // Doubled size for the character sprites
        
        // Start with idle texture
        const material = new THREE.MeshBasicMaterial({
            map: this.sprites.idle,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
            depthTest: true,
            depthWrite: true,
            renderOrder: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        // Увеличиваем высоту позиции, чтобы персонаж не входил в землю
        this.mesh.position.set(0, 2.5, 0); // Увеличенная высота над землей
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        this.mesh.renderOrder = 10; // Ensure character always renders on top
        this.mesh.material.polygonOffset = true;
        this.mesh.material.polygonOffsetFactor = -1; // Move the character forward in depth
        
        // Создаем обводку для визуализации границ персонажа
        this.createBoundingBox();
    }
    
    move(direction) {
        this.movementDirection.copy(direction);
        
        // Determine if the character is moving
        this.isMoving = direction.length() > 0;
        
        // Determine the direction the character is facing based on movement
        if (this.isMoving) {
            // Find the dominant direction (x or z)
            if (Math.abs(direction.x) > Math.abs(direction.z)) {
                // Moving primarily left or right
                this.lastDirection = direction.x > 0 ? 'right' : 'left';
            } else {
                // Moving primarily up or down
                this.lastDirection = direction.z > 0 ? 'down' : 'up';
            }
        }
    }
    
    // Check if character is over island or water and get appropriate height
    getTerrainHeightAt(position, island) {
        // Default to water level if no island is provided
        if (!island) return this.waterLevel;
        
        // Use the island's block map system to get the height
        const worldHeight = island.getHeightAt(position.x, position.z);
        
        // Convert the world height to our terrain height system
        // In our system: 0.0 = first layer, 1.0 = second layer, waterLevel = water
        if (worldHeight > island.cubeSize) {
            // Second layer (height > 1)
            return 1.0;
        } else if (worldHeight > 0) {
            // First layer (height = 1)
            return 0.0;
        } else {
            // Water (height = -0.1)
            return this.waterLevel;
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
        
        // Check if character is on water and update raft visibility
        const wasOnWater = this.isOnWater;
        this.isOnWater = terrainHeight === this.waterLevel;
        
        // Show or hide raft based on water status
        if (this.isOnWater && !wasOnWater) {
            this.raft.show();
        } else if (!this.isOnWater && wasOnWater) {
            this.raft.hide();
        }
        
        // Update raft position and animation
        if (this.raft) {
            // Pass both position and movement direction to the raft
            this.raft.update(deltaTime, this.mesh.position, this.movementDirection);
        }
        
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
        
        // Обновляем позицию маркера земли для отображения точки соприкосновения с землей
        if (this.groundMarker) {
            // Обновляем позицию маркера земли так, чтобы он был на уровне земли
            // Увеличиваем смещение вниз, чтобы маркер был на уровне земли
            this.groundMarker.position.y = -this.defaultHeightAboveTerrain - 0.5;
        }
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update debug text with current height information
        this.updateDebugText(terrainHeight, camera);
        
        // We no longer need to make the character face the camera since we're using directional sprites
    }
    
    createBoundingBox() {
        // Создаем куб для визуализации границ персонажа
        const boxSize = 1.5; // Увеличенный размер куба
        const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        
        // Материал для куба - прозрачный с обводкой
        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, // Зеленый цвет
            transparent: true,
            opacity: 0.2,
            wireframe: true // Режим каркаса для отображения только граней
        });
        
        // Создаем куб для обводки
        this.boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
        this.boundingBox.position.set(0, 0, 0); // Позиция относительно персонажа
        
        // Также создаем второй куб для отображения точки соприкосновения с землей
        const groundMarkerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const groundMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Красный цвет
        this.groundMarker = new THREE.Mesh(groundMarkerGeometry, groundMarkerMaterial);
        this.groundMarker.position.set(0, -0.75, 0); // Позиция в нижней части куба
        
        // Добавляем оба объекта к персонажу
        this.mesh.add(this.boundingBox);
        this.mesh.add(this.groundMarker);
    }
    
    updateAnimation(deltaTime) {
        // Update animation frame
        this.frameTime += deltaTime;
        
        if (this.frameTime >= this.animationSpeed) {
            this.frameTime = 0;
            this.currentFrame = (this.currentFrame + 1) % 6; // 6 frames per animation
        }
        
        // If on water (raft), always use idle animation regardless of movement
        if (this.isOnWater) {
            this.mesh.material.map = this.sprites.idle;
        } else {
            // Normal animation when not on water
            if (this.isMoving) {
                // Use the appropriate walking animation based on direction
                this.mesh.material.map = this.sprites[this.lastDirection][this.currentFrame];
            } else {
                // Use idle texture when not moving
                this.mesh.material.map = this.sprites.idle;
            }
        }
        
        // Make sure to update the material
        this.mesh.material.needsUpdate = true;
    }
    // Toggle debug elements visibility
    setDebugVisible(visible) {
        if (this.boundingBox) this.boundingBox.visible = visible;
        if (this.groundMarker) this.groundMarker.visible = visible;
        
        // Toggle HTML debug element
        if (this.debugElement) {
            this.debugElement.style.display = visible ? 'block' : 'none';
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
        
        // Determine animation state text
        let animationState = 'Idle';
        if (!this.isOnWater && this.isMoving) {
            animationState = `Walking (${this.lastDirection})`;
        } else if (this.isOnWater) {
            animationState = 'Idle (on raft)';
        }
        
        this.debugElement.textContent = `Height: ${this.mesh.position.y.toFixed(2)}
` + 
                                      `Target: ${this.targetHeight.toFixed(2)}
` + 
                                      `Terrain: ${terrainHeight.toFixed(2)} (${terrainType})
` + 
                                      `Direction: ${this.lastDirection}
` + 
                                      `Moving: ${this.isMoving ? 'Yes' : 'No'}
` + 
                                      `Animation: ${animationState}
` + 
                                      `Raft: ${this.isOnWater ? 'Visible' : 'Hidden'} (${this.raft.currentY.toFixed(2)})`;
    }
}

export { Character };
