// Debug controller to toggle visibility of debug elements
class DebugController {
    constructor() {
        // Debug state
        this.debugMode = false;
        
        // List of entities with debug elements
        this.debuggableEntities = [];
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for Tab key to toggle debug mode
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault(); // Prevent the default Tab behavior
                this.toggleDebugMode();
            }
        });
    }
    
    // Register an entity that has debug elements
    registerEntity(entity) {
        if (entity && typeof entity.setDebugVisible === 'function') {
            this.debuggableEntities.push(entity);
            // Initialize with current debug state
            entity.setDebugVisible(this.debugMode);
        }
    }
    
    // Toggle debug mode on/off
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
        
        // Update all registered entities
        this.debuggableEntities.forEach(entity => {
            entity.setDebugVisible(this.debugMode);
        });
    }
    
    // Get current debug mode state
    isDebugMode() {
        return this.debugMode;
    }
}

// Create a singleton instance
const debugController = new DebugController();

export { debugController };
