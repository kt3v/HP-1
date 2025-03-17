import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager.js';

class SplashEffect {
    constructor() {
        this.particleSystems = [];
        this.particlesPerSystem = 15; // Increased number of particles per system for better effect
        this.particleLifetime = 1.2; // seconds - slightly longer lifetime
        this.particleSize = 0.1;
        this.gravity = 9.8;
        this.active = false;
        
        // Ripple effect properties
        this.ripples = [];
        
        // Create a group to hold all particle systems and ripples
        this.mesh = new THREE.Group();
    }
    
    // Creates a new particle system at the specified position
    createParticleSystem(position) {
        // Create particle geometry and material
        const geometry = new THREE.SphereGeometry(this.particleSize, 4, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x85DEFE, // Light blue water color
            transparent: true,
            opacity: 0.7
        });
        
        // Create a group for this particle system
        const systemGroup = new THREE.Group();
        systemGroup.position.copy(position);
        this.mesh.add(systemGroup);
        
        // Create particles for this system
        const particles = [];
        
        for (let i = 0; i < this.particlesPerSystem; i++) {
            const particle = new THREE.Mesh(geometry, material.clone());
            particle.visible = false;
            
            // Add to system group
            systemGroup.add(particle);
            
            // Store particle properties
            particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(),
                lifetime: 0,
                active: false
            });
        }
        
        // Add this system to our collection
        this.particleSystems.push({
            group: systemGroup,
            particles: particles,
            active: false
        });
        
        return this.particleSystems.length - 1; // Return index of the new system
    }
    
    // Trigger multiple splash effects at different positions
    triggerMultiple(positions, direction = 'up', centerPosition = null) {
        this.active = true;
        
        // Clear any existing particle systems and ripples
        this.clearParticleSystems();
        
        // If entering water (direction is 'down') and centerPosition is provided,
        // create the center ripple first for better visual effect
        if (direction === 'down' && centerPosition) {
            this.createRipple(centerPosition, true); // Create a larger ripple
        }
        
        // Create and trigger a splash at each position
        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];
            const systemIndex = this.createParticleSystem(position);
            this.triggerSystem(systemIndex, direction, false); // Don't create ripples for corner splashes
            
            // Play sound only for the first splash to avoid too many sounds at once
            if (i === 0) {
                // Play splash sound with random pitch
                const soundName = direction === 'up' ? 'splash_up' : 'splash_down';
                soundManager.play(soundName, {
                    volume: 0.4,
                    randomPitch: true,
                    minPitch: 0.8,
                    maxPitch: 1.2
                });
            }
        }
    }
    
    // Trigger a single splash effect
    trigger(position, direction = 'up') {
        this.active = true;
        
        // Clear any existing particle systems
        this.clearParticleSystems();
        
        // Create and trigger a single splash
        const systemIndex = this.createParticleSystem(position);
        this.triggerSystem(systemIndex, direction);
        
        // Play splash sound with random pitch
        const soundName = direction === 'up' ? 'splash_up' : 'splash_down';
        soundManager.play(soundName, {
            volume: 0.4,
            randomPitch: true,
            minPitch: 0.8,
            maxPitch: 1.2
        });
    }
    
    // Trigger a specific particle system
    triggerSystem(systemIndex, direction = 'up', createRipple = true) {
        if (systemIndex < 0 || systemIndex >= this.particleSystems.length) return;
        
        const system = this.particleSystems[systemIndex];
        system.active = true;
        
        // Create a ripple effect at the splash position if requested
        if (createRipple) {
            this.createRipple(system.group.position.clone(), false);
        }
        
        // Add some variation to each splash system
        const variationFactor = 0.5 + Math.random(); // Between 0.5 and 1.5
        const angleOffset = Math.random() * Math.PI * 2; // Random angle offset for this system
        
        // Reset and activate all particles with random velocities
        for (const particle of system.particles) {
            // Random horizontal spread with some variation
            const angle = angleOffset + (Math.random() * Math.PI);
            const radius = Math.random() * 0.3;
            
            // Set initial position with slight offset
            particle.mesh.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            // Randomize particle size for more natural look
            const sizeVariation = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
            particle.mesh.scale.set(sizeVariation, sizeVariation, sizeVariation);
            
            // Set velocity based on direction with variation
            const speed = (1 + Math.random() * 2) * variationFactor;
            if (direction === 'up') {
                // Splash upward when raft emerges
                particle.velocity.set(
                    (Math.random() - 0.5) * 2,
                    (2 + Math.random() * 2) * variationFactor,
                    (Math.random() - 0.5) * 2
                );
            } else {
                // Splash outward when raft submerges
                particle.velocity.set(
                    (Math.random() - 0.5) * 3 * variationFactor,
                    (0.5 + Math.random()) * variationFactor,
                    (Math.random() - 0.5) * 3 * variationFactor
                );
            }
            
            // Scale velocity by speed
            particle.velocity.multiplyScalar(speed);
            
            // Randomize color slightly for more natural look
            const hue = 0.55 + (Math.random() - 0.5) * 0.1; // Slight variation in blue hue
            const saturation = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
            const lightness = 0.7 + Math.random() * 0.3; // Between 0.7 and 1.0
            
            // Convert HSL to RGB
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            particle.mesh.material.color = color;
            
            // Reset lifetime and activate
            particle.lifetime = this.particleLifetime * (0.5 + Math.random() * 0.5);
            particle.active = true;
            particle.mesh.visible = true;
            particle.mesh.material.opacity = 0.7;
        }
    }
    
    // Create a ripple effect on the water surface
    createRipple(position, isLarge = false) {
        // Create a ring geometry for the ripple
        const initialRadius = isLarge ? 0.5 : 0.2;
        const segments = 32;
        const ringGeometry = new THREE.RingGeometry(initialRadius, initialRadius + (isLarge ? 0.2 : 0.1), segments);
        
        // Create a material with transparency
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: isLarge ? 0.8 : 0.7,
            side: THREE.DoubleSide
        });
        
        // Create the ripple mesh
        const ripple = new THREE.Mesh(ringGeometry, material);
        
        // Position the ripple just above the water surface to avoid z-fighting
        position.y = -0.19;
        ripple.position.copy(position);
        
        // Rotate to lay flat on the water
        ripple.rotation.x = -Math.PI / 2;
        
        // Add to scene
        this.mesh.add(ripple);
        
        // Store ripple properties for animation
        this.ripples.push({
            mesh: ripple,
            initialRadius: initialRadius,
            lifetime: isLarge ? 2.0 : 1.5, // longer lifetime for large ripples
            maxRadius: isLarge ? 4.0 : 2.0, // larger maximum radius
            expandSpeed: isLarge ? 1.5 : 1.0 // faster expansion for large ripples
        });
    }
    
    // Clear all particle systems
    clearParticleSystems() {
        // Remove all existing particle systems from the scene
        for (const system of this.particleSystems) {
            this.mesh.remove(system.group);
        }
        
        // Reset the array
        this.particleSystems = [];
    }
    
    update(deltaTime) {
        let anyActive = false;
        
        // Update each particle system
        for (const system of this.particleSystems) {
            let systemActive = false;
            
            for (const particle of system.particles) {
                if (!particle.active) continue;
                
                // Update lifetime
                particle.lifetime -= deltaTime;
                
                if (particle.lifetime <= 0) {
                    // Deactivate particle
                    particle.active = false;
                    particle.mesh.visible = false;
                    continue;
                }
                
                // Update position based on velocity
                particle.mesh.position.x += particle.velocity.x * deltaTime;
                particle.mesh.position.y += particle.velocity.y * deltaTime;
                particle.mesh.position.z += particle.velocity.z * deltaTime;
                
                // Apply gravity
                particle.velocity.y -= this.gravity * deltaTime;
                
                // Fade out as lifetime decreases
                const fadeStart = 0.3; // Start fading when 30% of lifetime remains
                if (particle.lifetime < this.particleLifetime * fadeStart) {
                    particle.mesh.material.opacity = 0.7 * (particle.lifetime / (this.particleLifetime * fadeStart));
                }
                
                systemActive = true;
            }
            
            system.active = systemActive;
            anyActive = anyActive || systemActive;
        }
        
        // Update ripple effects
        let rippleIndex = 0;
        while (rippleIndex < this.ripples.length) {
            const ripple = this.ripples[rippleIndex];
            
            // Update lifetime
            ripple.lifetime -= deltaTime;
            
            if (ripple.lifetime <= 0) {
                // Remove ripple from scene and array
                this.mesh.remove(ripple.mesh);
                this.ripples.splice(rippleIndex, 1);
                continue;
            }
            
            // Expand the ripple
            const currentRadius = ripple.initialRadius + 
                (ripple.maxRadius - ripple.initialRadius) * 
                (1 - ripple.lifetime / 1.5);
            
            // Update the ring geometry
            ripple.mesh.geometry.dispose();
            ripple.mesh.geometry = new THREE.RingGeometry(
                currentRadius, 
                currentRadius + 0.1, 
                32
            );
            
            // Fade out as it expands
            ripple.mesh.material.opacity = 0.7 * (ripple.lifetime / 1.5);
            
            anyActive = true;
            rippleIndex++;
        }
        
        // Keep the effect active if any particles or ripples are active
        this.active = anyActive;
    }
}

export { SplashEffect };
