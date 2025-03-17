import * as THREE from 'three';
import { SplashEffect } from '../effects/SplashEffect.js';

class Raft {
    constructor() {
        // Raft properties
        this.isVisible = false;
        this.targetY = -0.7; // Start below water level (same as waterLevel in Character.js)
        this.currentY = -0.7;
        this.verticalSpeed = 0.1; // Speed of vertical movement
        
        // Rotation properties
        this.currentRotation = new THREE.Euler(0, 0, 0);
        this.targetRotation = new THREE.Euler(0, 0, 0);
        this.rotationSpeed = 0.1; // Increased speed of rotation adjustment
        this.lastPosition = new THREE.Vector3(0, 0, 0);
        
        // Flag animation properties
        this.flagAnimationTime = 0;
        
        // Create splash effect
        this.splashEffect = new SplashEffect();
        
        // Create raft mesh
        this.createMesh();
    }
    
    createMesh() {
        // Create a group to hold all raft parts
        this.mesh = new THREE.Group();
        // Start with raft invisible
        this.mesh.visible = false;
        
        // Create wooden planks for the raft
        const plankMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown color
            roughness: 0.9,
            metalness: 0.1
        });
        
        const darkerPlankMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321, // Darker brown
            roughness: 0.85,
            metalness: 0.15
        });
        
        // Create 5 planks for the raft
        const plankWidth = 0.5;
        const plankHeight = 0.25;
        const plankLength = 3;
        const plankSpacing = 0.1;
        const totalWidth = 5 * plankWidth + 4 * plankSpacing;
        
        for (let i = 0; i < 5; i++) {
            const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankLength);
            const plank = new THREE.Mesh(
                plankGeometry, 
                i % 2 === 0 ? plankMaterial : darkerPlankMaterial // Alternate colors
            );
            
            // Position planks side by side with small gaps
            const xOffset = (i * (plankWidth + plankSpacing)) - (totalWidth / 2) + (plankWidth / 2);
            plank.position.set(xOffset, 0, 0);
            
            // Add some random rotation to make it look more natural
            plank.rotation.z = (Math.random() - 0.5) * 0.05;
            plank.rotation.x = (Math.random() - 0.5) * 0.05;
            
            plank.castShadow = true;
            plank.receiveShadow = true;
            this.mesh.add(plank);
        }
        
        // Add two cross planks underneath for stability
        const crossPlankGeometry = new THREE.BoxGeometry(totalWidth, plankHeight, plankWidth);
        
        // Front cross plank
        const frontCrossPlank = new THREE.Mesh(crossPlankGeometry, darkerPlankMaterial);
        frontCrossPlank.position.set(0, -plankHeight, plankLength/3);
        frontCrossPlank.castShadow = true;
        frontCrossPlank.receiveShadow = true;
        this.mesh.add(frontCrossPlank);
        
        // Back cross plank
        const backCrossPlank = new THREE.Mesh(crossPlankGeometry, darkerPlankMaterial);
        backCrossPlank.position.set(0, -plankHeight, -plankLength/3);
        backCrossPlank.castShadow = true;
        backCrossPlank.receiveShadow = true;
        this.mesh.add(backCrossPlank);
        
        // Add a small post at the front of the raft to make rotation more visible
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D4037, // Dark brown
            roughness: 0.7,
            metalness: 0.2
        });
        
        const frontPost = new THREE.Mesh(postGeometry, postMaterial);
        frontPost.position.set(0, 0.3, -1.3); // Position at the front of the raft
        frontPost.castShadow = true;
        frontPost.receiveShadow = true;
        this.mesh.add(frontPost);
        
        // Add a small flag to the post
        const flagGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: 0xA52A2A, // Brown-red
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0, 0.6, -1.3);
        flag.rotation.y = Math.PI / 2; // Rotate to face sideways
        flag.castShadow = true;
        this.mesh.add(flag);
        
        // Store reference to flag for animation
        this.flag = flag;
        
        // Start below water
        this.mesh.position.y = this.currentY;
    }
    
    show() {
        if (!this.isVisible) {
            this.isVisible = true;
            this.targetY = 0.1; // Position slightly below water surface
            
            // Make raft visible
            this.mesh.visible = true;
            
            // Trigger splash effects at the four corners of the raft
            if (this.splashEffect) {
                // Calculate the four corner positions of the raft
                const raftSize = 1.5; // Half the size of the raft
                const cornerPositions = [
                    // Front-left corner
                    new THREE.Vector3(
                        this.mesh.position.x - raftSize,
                        -0.2, // Water level
                        this.mesh.position.z - raftSize
                    ),
                    // Front-right corner
                    new THREE.Vector3(
                        this.mesh.position.x + raftSize,
                        -0.2, // Water level
                        this.mesh.position.z - raftSize
                    ),
                    // Back-left corner
                    new THREE.Vector3(
                        this.mesh.position.x - raftSize,
                        -0.2, // Water level
                        this.mesh.position.z + raftSize
                    ),
                    // Back-right corner
                    new THREE.Vector3(
                        this.mesh.position.x + raftSize,
                        -0.2, // Water level
                        this.mesh.position.z + raftSize
                    )
                ];
                
                // When emerging from water, only create corner splashes
                this.splashEffect.triggerMultiple(cornerPositions, 'up');
            }
        }
    }
    
    hide() {
        if (this.isVisible) {
            this.isVisible = false;
            this.targetY = -0.7; // Position below water level
            
            // Immediately make the raft invisible to prevent seeing it underwater
            this.mesh.visible = false;
            
            // Trigger splash effects at the four corners of the raft
            if (this.splashEffect) {
                // Calculate the four corner positions of the raft
                const raftSize = 1.5; // Half the size of the raft
                const cornerPositions = [
                    // Front-left corner
                    new THREE.Vector3(
                        this.mesh.position.x - raftSize,
                        -0.2, // Water level
                        this.mesh.position.z - raftSize
                    ),
                    // Front-right corner
                    new THREE.Vector3(
                        this.mesh.position.x + raftSize,
                        -0.2, // Water level
                        this.mesh.position.z - raftSize
                    ),
                    // Back-left corner
                    new THREE.Vector3(
                        this.mesh.position.x - raftSize,
                        -0.2, // Water level
                        this.mesh.position.z + raftSize
                    ),
                    // Back-right corner
                    new THREE.Vector3(
                        this.mesh.position.x + raftSize,
                        -0.2, // Water level
                        this.mesh.position.z + raftSize
                    )
                ];
                
                // Create center position for ripple
                const centerPosition = new THREE.Vector3(
                    this.mesh.position.x,
                    -0.2, // Water level
                    this.mesh.position.z
                );
                
                // When entering water, create both corner splashes and center ripple
                this.splashEffect.triggerMultiple(cornerPositions, 'down', centerPosition);
            }
        }
    }
    
    update(deltaTime, characterPosition, movementDirection) {
        // Update splash effect
        if (this.splashEffect) {
            this.splashEffect.update(deltaTime);
        }
        
        // Update flag animation - only if raft is visible
        if (this.flag && this.isVisible && this.mesh.visible) {
            this.flagAnimationTime += deltaTime;
            // Make the flag wave slightly
            const waveAmount = Math.sin(this.flagAnimationTime * 3) * 0.1;
            this.flag.rotation.z = waveAmount;
        }
        
        // Use provided movement direction if available, otherwise calculate from position change
        const movementVector = new THREE.Vector3();
        if (movementDirection && movementDirection.length() > 0) {
            // Use the character's movement direction directly
            movementVector.copy(movementDirection);
        } else if (this.lastPosition.x !== 0 || this.lastPosition.z !== 0) {
            // Calculate from position change as fallback
            movementVector.subVectors(characterPosition, this.lastPosition);
        }
        
        // Update raft position to follow character horizontally (even when invisible)
        this.mesh.position.x = characterPosition.x;
        this.mesh.position.z = characterPosition.z;
        
        // Smoothly adjust vertical position
        if (Math.abs(this.currentY - this.targetY) > 0.01) {
            if (this.currentY < this.targetY) {
                this.currentY += this.verticalSpeed * deltaTime * 60;
                if (this.currentY > this.targetY) {
                    this.currentY = this.targetY;
                }
            } else {
                this.currentY -= this.verticalSpeed * deltaTime * 60;
                if (this.currentY < this.targetY) {
                    this.currentY = this.targetY;
                }
            }
            
            // Update mesh position
            this.mesh.position.y = this.currentY;
            
            // If raft is going underwater, hide it completely once it reaches a certain depth
            if (!this.isVisible && this.currentY < -0.5) {
                this.mesh.visible = false;
            }
        }
        
        // Update rotation based on movement direction (even when invisible)
        if (movementVector.length() > 0.001 && this.isVisible) { // Only rotate if there's significant movement and raft is active
            // Calculate target rotation based on movement direction
            this.targetRotation.y = Math.atan2(movementVector.x, movementVector.z);
            
            // Smoothly interpolate current rotation towards target rotation
            const deltaRotation = this.targetRotation.y - this.currentRotation.y;
            
            // Handle angle wrapping (e.g., going from 359° to 1°)
            let shortestDelta = ((deltaRotation + Math.PI) % (Math.PI * 2)) - Math.PI;
            if (shortestDelta < -Math.PI) {
                shortestDelta += Math.PI * 2;
            }
            
            // Apply rotation with smoothing
            if (Math.abs(shortestDelta) > 0.01) {
                this.currentRotation.y += shortestDelta * this.rotationSpeed;
                
                // Keep angle in the range of -PI to PI
                if (this.currentRotation.y > Math.PI) {
                    this.currentRotation.y -= Math.PI * 2;
                } else if (this.currentRotation.y < -Math.PI) {
                    this.currentRotation.y += Math.PI * 2;
                }
                
                // Apply rotation to mesh
                this.mesh.rotation.y = this.currentRotation.y;
            }
        }
        
        // Store current position for next frame
        this.lastPosition.copy(characterPosition);
    }
}

export { Raft };
