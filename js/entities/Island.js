import * as THREE from 'three';

class Island {
    constructor(size = 10, cubeSize = 1) {
        this.size = size;
        this.cubeSize = cubeSize;
        this.cubes = [];
        
        // Create materials
        this.materials = {
            grass: new THREE.MeshStandardMaterial({ color: 0x3cb043 }), // Grass green
            dirt: new THREE.MeshStandardMaterial({ color: 0x8b4513 }), // Brown
            sand: new THREE.MeshStandardMaterial({ color: 0xc2b280 }) // Sand color
        };
        
        // Create geometry
        this.cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // Build the island
        this.buildIsland();
    }
    
    buildIsland() {
        // Calculate center offset to center the island
        const centerOffset = (this.size - 1) / 2;
        
        // Create island with slight height variations
        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                // Determine if this is an edge cube (for beach)
                const isEdge = x === 0 || z === 0 || x === this.size - 1 || z === this.size - 1;
                
                // Create the main cube (top)
                const cube = new THREE.Mesh(
                    this.cubeGeometry,
                    isEdge ? this.materials.sand : this.materials.grass
                );
                
                // Position the cube
                cube.position.x = (x - centerOffset) * this.cubeSize;
                cube.position.z = (z - centerOffset) * this.cubeSize;
                cube.position.y = 0; // Base level
                
                // Add some random height variation for non-edge cubes
                if (!isEdge && Math.random() > 0.7) {
                    cube.position.y += 0.5 * Math.random();
                }
                
                cube.castShadow = true;
                cube.receiveShadow = true;
                this.cubes.push(cube);
                
                // Add dirt cubes below the surface
                const dirtCube = new THREE.Mesh(this.cubeGeometry, this.materials.dirt);
                dirtCube.position.x = cube.position.x;
                dirtCube.position.z = cube.position.z;
                dirtCube.position.y = cube.position.y - this.cubeSize;
                dirtCube.castShadow = false;
                dirtCube.receiveShadow = false;
                this.cubes.push(dirtCube);
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
        return (this.size / 2) * this.cubeSize;
    }
}

export { Island };
