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
        
        // Create a canvas for the face
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Draw a simple face on the canvas
        context.fillStyle = '#FFD700'; // Golden face
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
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 1, 0); // Position above the island
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
    }
    
    move(direction) {
        this.movementDirection.copy(direction);
    }
    
    update(deltaTime, camera) {
        // Move character
        if (this.movementDirection.length() > 0) {
            this.mesh.position.x += this.movementDirection.x * this.speed;
            this.mesh.position.z += this.movementDirection.z * this.speed;
            
            // Limit character to island bounds (with some margin)
            const islandRadius = 4.5;
            const characterRadius = 0.75;
            const totalRadius = islandRadius - characterRadius;
            
            const distance = Math.sqrt(
                this.mesh.position.x * this.mesh.position.x + 
                this.mesh.position.z * this.mesh.position.z
            );
            
            if (distance > totalRadius) {
                const angle = Math.atan2(this.mesh.position.z, this.mesh.position.x);
                this.mesh.position.x = Math.cos(angle) * totalRadius;
                this.mesh.position.z = Math.sin(angle) * totalRadius;
            }
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
