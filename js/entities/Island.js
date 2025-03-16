import * as THREE from 'three';

class Island {
    constructor(size = 10, cubeSize = 1) {
        this.size = size;
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
        // Calculate center offset to center the island
        const centerOffset = (this.size - 1) / 2;
        
        // Create island with all cubes the same height and color
        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                // Create the main cube (top) - all yellow now
                const cube = new THREE.Mesh(
                    this.cubeGeometry,
                    this.materials.surface // All cubes are yellow
                );
                
                // Position the cube
                cube.position.x = (x - centerOffset) * this.cubeSize;
                cube.position.z = (z - centerOffset) * this.cubeSize;
                cube.position.y = 0; // All cubes at the same height
                
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
