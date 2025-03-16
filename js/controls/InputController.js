import * as THREE from 'three';

class InputController {
    constructor(character) {
        this.character = character;
        this.keysPressed = {};
        this.touchJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
        this.movementDirection = new THREE.Vector3(0, 0, 0);
        
        // Create virtual joystick for mobile
        this.createVirtualJoystick();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    createVirtualJoystick() {
        // Create a virtual joystick container for mobile devices
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.style.position = 'absolute';
        this.joystickContainer.style.bottom = '20px';
        this.joystickContainer.style.left = '20px';
        this.joystickContainer.style.width = '120px';
        this.joystickContainer.style.height = '120px';
        this.joystickContainer.style.borderRadius = '60px';
        this.joystickContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        this.joystickContainer.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        this.joystickContainer.style.display = 'none'; // Hide by default, show on mobile
        
        // Create the joystick knob
        this.joystickKnob = document.createElement('div');
        this.joystickKnob.style.position = 'absolute';
        this.joystickKnob.style.top = '35px';
        this.joystickKnob.style.left = '35px';
        this.joystickKnob.style.width = '50px';
        this.joystickKnob.style.height = '50px';
        this.joystickKnob.style.borderRadius = '25px';
        this.joystickKnob.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        
        this.joystickContainer.appendChild(this.joystickKnob);
        document.body.appendChild(this.joystickContainer);
        
        // Show joystick on mobile devices
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.joystickContainer.style.display = 'block';
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        
        // Touch controls for virtual joystick
        this.joystickContainer.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const rect = this.joystickContainer.getBoundingClientRect();
            this.touchJoystick.active = true;
            this.touchJoystick.startX = rect.left + rect.width / 2;
            this.touchJoystick.startY = rect.top + rect.height / 2;
            this.touchJoystick.currentX = touch.clientX;
            this.touchJoystick.currentY = touch.clientY;
            this.updateJoystickPosition();
        });
        
        this.joystickContainer.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (this.touchJoystick.active) {
                const touch = event.touches[0];
                this.touchJoystick.currentX = touch.clientX;
                this.touchJoystick.currentY = touch.clientY;
                this.updateJoystickPosition();
            }
        });
        
        const endTouch = (event) => {
            event.preventDefault();
            this.touchJoystick.active = false;
            this.joystickKnob.style.top = '35px';
            this.joystickKnob.style.left = '35px';
            this.movementDirection.set(0, 0, 0);
            this.updateCharacterMovement();
        };
        
        this.joystickContainer.addEventListener('touchend', endTouch);
        this.joystickContainer.addEventListener('touchcancel', endTouch);
        
        // Update character movement on each frame
        this.updateInterval = setInterval(() => this.updateCharacterMovement(), 16); // ~60fps
    }
    
    updateJoystickPosition() {
        if (!this.touchJoystick.active) return;
        
        const deltaX = this.touchJoystick.currentX - this.touchJoystick.startX;
        const deltaY = this.touchJoystick.currentY - this.touchJoystick.startY;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50);
        const angle = Math.atan2(deltaY, deltaX);
        
        const knobX = 35 + Math.cos(angle) * distance;
        const knobY = 35 + Math.sin(angle) * distance;
        
        this.joystickKnob.style.left = `${knobX}px`;
        this.joystickKnob.style.top = `${knobY}px`;
        
        // Normalize for movement direction
        const normalizedX = deltaX / 50;
        const normalizedY = deltaY / 50;
        
        // Update movement direction (X is left/right, Z is forward/backward in Three.js)
        this.movementDirection.x = normalizedX;
        this.movementDirection.z = normalizedY;
        
        this.updateCharacterMovement();
    }
    
    updateCharacterMovement() {
        // Reset movement direction if using keyboard
        if (!this.touchJoystick.active) {
            this.movementDirection.set(0, 0, 0);
        }
        
        // Handle keyboard input
        if (this.keysPressed['w'] || this.keysPressed['arrowup']) {
            this.movementDirection.z = -1;
        }
        if (this.keysPressed['s'] || this.keysPressed['arrowdown']) {
            this.movementDirection.z = 1;
        }
        if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
            this.movementDirection.x = -1;
        }
        if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
            this.movementDirection.x = 1;
        }
        
        // Normalize diagonal movement
        if (this.movementDirection.length() > 1) {
            this.movementDirection.normalize();
        }
        
        // Update character movement
        if (this.character) {
            this.character.move(this.movementDirection);
        }
    }
    
    // Clean up event listeners when no longer needed
    dispose() {
        clearInterval(this.updateInterval);
        // Remove the joystick from the DOM
        if (this.joystickContainer && this.joystickContainer.parentNode) {
            this.joystickContainer.parentNode.removeChild(this.joystickContainer);
        }
    }
}

export { InputController };
