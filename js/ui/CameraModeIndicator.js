import { IndicatorSettings } from '../config/CameraConfig.js';

class CameraModeIndicator {
    constructor() {
        // Create the indicator element
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '10px';
        this.element.style.right = '10px';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.element.style.color = 'white';
        this.element.style.padding = '8px 12px';
        this.element.style.borderRadius = '4px';
        this.element.style.fontFamily = 'Arial, sans-serif';
        this.element.style.fontSize = '14px';
        this.element.style.zIndex = '1000';
        this.element.style.transition = 'opacity 0.3s';
        this.element.style.userSelect = 'none';
        this.element.style.pointerEvents = 'none';
        
        // Add to document
        document.body.appendChild(this.element);
        
        // Set initial text
        this.updateMode('perspective');
        
        // Auto-hide timer
        this.hideTimeout = null;
    }
    
    updateMode(mode) {
        // Clear any existing timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        
        // Update text based on mode
        const modeName = mode === 'perspective' ? 'Perspective' : 'Orthographic';
        this.element.textContent = `Camera: ${modeName} (P to toggle)`;
        
        // Show the element
        this.element.style.opacity = '1';
        
        // Set timeout to fade out based on config settings
        this.hideTimeout = setTimeout(() => {
            this.element.style.opacity = IndicatorSettings.FADE_OPACITY.toString();
        }, IndicatorSettings.FADE_DELAY);
    }
    
    // Clean up
    dispose() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

export { CameraModeIndicator };
