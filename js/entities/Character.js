import * as THREE from 'three';

class Character {
    constructor() {
        this.speed = 0.05;
        this.movementDirection = new THREE.Vector3(0, 0, 0);
        
        // Create a 2D face in 3D space (billboard technique)
        this.createMesh();
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
    
    update(deltaTime, camera) {
        // Move character
        if (this.movementDirection.length() > 0) {
            this.mesh.position.x += this.movementDirection.x * this.speed;
            this.mesh.position.z += this.movementDirection.z * this.speed;
            
            // No boundary restriction - character can move freely
        }
        
        // Make the character always face the camera (billboard technique)
        if (camera) {
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0; // Keep character upright
            this.mesh.lookAt(
                this.mesh.position.x - cameraDirection.x,
                this.mesh.position.y,
                this.mesh.position.z - cameraDirection.z
            );
        }
    }
}

export { Character };
