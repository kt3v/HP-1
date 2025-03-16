import * as THREE from 'three';

class Water {
    constructor(size = 100, segments = 32) {
        // Create a simple water plane with animated material
        this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
        
        // Create water material
        this.material = new THREE.MeshStandardMaterial({
            color: 0x0077be,
            metalness: 0.1,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        this.mesh.position.y = -0.2; // Slightly below 0
        this.mesh.receiveShadow = true;
        
        // Store vertices for animation
        this.setupVertices();
    }
    
    setupVertices() {
        const waterVertices = this.geometry.attributes.position;
        this.vertices = [];
        
        for (let i = 0; i < waterVertices.count; i++) {
            const x = waterVertices.getX(i);
            const y = waterVertices.getY(i);
            const z = waterVertices.getZ(i);
            this.vertices.push({
                x: x,
                y: y,
                z: z,
                originalZ: z,
                randomSpeed: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    update(deltaTime) {
        const time = performance.now() * 0.001; // Current time in seconds
        const waterVertices = this.mesh.geometry.attributes.position;
        
        for (let i = 0; i < this.vertices.length; i++) {
            const vertex = this.vertices[i];
            // Create wave effect
            const waveX = Math.sin(vertex.x / 2 + time) * 0.2;
            const waveY = Math.cos(vertex.y / 2 + time) * 0.2;
            waterVertices.setZ(i, vertex.originalZ + waveX + waveY);
        }
        
        waterVertices.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
    }
}

export { Water };
