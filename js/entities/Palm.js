import * as THREE from 'three';

class Palm {
    constructor() {
        // Reducing the palm size to better match the bounding box
        // Making it just a bit larger than the character (1.2x instead of 1.5x)
        this.size = 4;
        
        // Load the palm texture
        const textureLoader = new THREE.TextureLoader();
        const palmTexture = textureLoader.load('assets/textures/Palm.png');
        
        // Apply nearest filter for pixel art look
        palmTexture.magFilter = THREE.NearestFilter;
        palmTexture.minFilter = THREE.NearestFilter;
        
        // Create the palm mesh
        const geometry = new THREE.PlaneGeometry(this.size, this.size);
        
        // Adjust the geometry to have pivot point at the bottom
        // This moves all vertices up by half the height so the bottom edge is at y=0
        geometry.translate(0, this.size / 2, 0);
        
        const material = new THREE.MeshBasicMaterial({
            map: palmTexture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
            depthTest: true,
            depthWrite: true,
            renderOrder: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
        this.mesh.renderOrder = 10; // Ensure palm always renders on top
        this.mesh.material.polygonOffset = true;
        this.mesh.material.polygonOffsetFactor = -1; // Move the palm forward in depth
        
        // Create bounding box for visualization
        this.createBoundingBox();
    }
    
    // Create a bounding box similar to the character's
    createBoundingBox() {
        // Create a cube to visualize the palm's boundaries
        // Making the box slightly smaller to better match the visual sprite
        const boxSize = 1.2;
        const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        
        // Material for the cube - transparent with wireframe
        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF00C8, // Green color
            transparent: true,
            opacity: 0.2,
            wireframe: true // Wireframe mode to show only edges
        });
        
        // Create the bounding box cube
        this.boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
        // Position the bounding box to match the new pivot point (centered at the bottom)
        this.boundingBox.position.set(0, boxSize, 0);
        
        // Also create a ground marker to show the contact point with the ground
        const groundMarkerGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const groundMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Red color
        this.groundMarker = new THREE.Mesh(groundMarkerGeometry, groundMarkerMaterial);
        this.groundMarker.position.set(0, 0, 0); // Position at the exact pivot point (bottom of palm)
        
        // Add both objects to the palm
        this.mesh.add(this.boundingBox);
        this.mesh.add(this.groundMarker);
    }
    
    // This method is no longer needed as we're using the Island's spawn system
    // Kept as a stub for compatibility
    placeOnIsland(island) {
        console.log('Using Island spawn system instead of direct placement');
    }
    
    // Make the palm face somewhat toward the camera, but not completely
    faceCamera(camera) {
        // Create a semi-billboard effect - partially face the camera
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);
        
        // Calculate direction vector from palm to camera (on XZ plane only)
        const direction = new THREE.Vector3();
        direction.subVectors(cameraPosition, this.mesh.position);
        direction.y = 0; // Keep the direction on the XZ plane
        
        // Only update if we have a valid direction
        if (direction.length() > 0) {
            // Calculate the angle on the XZ plane
            const targetAngle = Math.atan2(direction.x, direction.z);
            
            // Default angle - facing forward (toward positive Z)
            const defaultAngle = 0;
            
            // Blend between default angle and target angle
            // Lower values (closer to 0) will make it face more forward
            // Higher values (closer to 1) will make it face more toward the camera
            const blendFactor = 0.3; // Only rotate 30% toward camera
            
            // Calculate the blended angle
            const blendedAngle = defaultAngle * (1 - blendFactor) + targetAngle * blendFactor;
            
            // Apply rotation around Y axis only
            this.mesh.rotation.set(0, blendedAngle, 0);
        }
    }
    
    update(camera) {
        // Update palm to face the camera each frame
        this.faceCamera(camera);
        
        // Ground marker is now at the pivot point (bottom of palm)
        // No need to update its position anymore
    }
    
    addToScene(scene) {
        scene.add(this.mesh);
    }
}

export { Palm };
