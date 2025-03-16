import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraModeIndicator } from '../ui/CameraModeIndicator.js';
import { DEFAULT_CAMERA_MODE, CommonSettings, PerspectiveSettings, OrthographicSettings, IndicatorSettings } from '../config/CameraConfig.js';

class Camera {
    constructor(renderer) {
        this.renderer = renderer;
        this.aspect = window.innerWidth / window.innerHeight;
        
        // Event listeners for camera changes
        this.onCameraChangeCallbacks = [];
        
        // Camera modes
        this.cameraMode = DEFAULT_CAMERA_MODE; // 'perspective' or 'orthographic'
        
        // Create perspective camera
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            PerspectiveSettings.FOV, // Field of view
            this.aspect, // Aspect ratio
            CommonSettings.NEAR_PLANE, // Near clipping plane
            CommonSettings.FAR_PLANE // Far clipping plane
        );
        
        // Create orthographic camera with similar view
        // Use a smaller frustum size since we're closer to the object
        const frustumSize = OrthographicSettings.FRUSTUM_SIZE;
        this.orthographicCamera = new THREE.OrthographicCamera(
            frustumSize * this.aspect / -2,
            frustumSize * this.aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            CommonSettings.NEAR_PLANE,
            CommonSettings.FAR_PLANE
        );
        
        // Set initial position for both cameras
        this.perspectiveCamera.position.copy(PerspectiveSettings.INITIAL_POSITION);
        this.orthographicCamera.position.copy(OrthographicSettings.INITIAL_POSITION);
        this.perspectiveCamera.lookAt(0, 0, 0);
        this.orthographicCamera.lookAt(0, 0, 0);
        
        // Set active camera based on default mode
        this.camera = (this.cameraMode === 'perspective') ? this.perspectiveCamera : this.orthographicCamera;
        
        // Add orbit controls with restrictions
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.controls.enableDamping = CommonSettings.ENABLE_DAMPING;
        this.controls.dampingFactor = CommonSettings.DAMPING_FACTOR;
        
        // Disable camera rotation/movement but keep zoom functionality
        this.controls.enableRotate = CommonSettings.ENABLE_ROTATE;
        this.controls.enablePan = CommonSettings.ENABLE_PAN;
        this.controls.enableZoom = CommonSettings.ENABLE_ZOOM;
        
        // Set zoom limits
        this.controls.minDistance = CommonSettings.MIN_ZOOM_DISTANCE;
        this.controls.maxDistance = CommonSettings.MAX_ZOOM_DISTANCE;
        
        // Camera follow settings
        this.target = null;
        this.perspectiveOffset = PerspectiveSettings.FOLLOW_OFFSET.clone();
        this.orthographicOffset = OrthographicSettings.FOLLOW_OFFSET.clone();
        this.offset = (this.cameraMode === 'perspective') ? this.perspectiveOffset.clone() : this.orthographicOffset.clone(); // Current active offset
        this.smoothFactor = CommonSettings.SMOOTH_FACTOR; // Camera follow smoothing factor
        
        // Setup camera toggle with P key
        this.setupCameraToggle();
        
        // Create camera mode indicator
        this.modeIndicator = new CameraModeIndicator();
        this.modeIndicator.updateMode(this.cameraMode);
    }
    
    // Setup event listener for camera toggle
    setupCameraToggle() {
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'p') {
                this.toggleCameraMode();
            }
        });
    }
    
    // Toggle between perspective and orthographic camera modes
    toggleCameraMode() {
        // Save current camera position and target
        const currentPosition = new THREE.Vector3().copy(this.camera.position);
        const currentTarget = new THREE.Vector3();
        if (this.target && this.target.mesh) {
            currentTarget.copy(this.target.mesh.position);
        } else {
            // If no target, use a point in front of the camera
            this.camera.getWorldDirection(currentTarget);
            currentTarget.multiplyScalar(10).add(this.camera.position);
        }
        
        // Switch camera mode
        if (this.cameraMode === 'perspective') {
            this.cameraMode = 'orthographic';
            this.camera = this.orthographicCamera;
            this.offset = this.orthographicOffset.clone();
        } else {
            this.cameraMode = 'perspective';
            this.camera = this.perspectiveCamera;
            this.offset = this.perspectiveOffset.clone();
        }
        
        // Apply position to new active camera
        this.camera.position.copy(currentPosition);
        this.camera.lookAt(currentTarget);
        
        // Update controls to use the new camera
        this.controls.object = this.camera;
        this.controls.update();
        
        console.log(`Camera mode switched to: ${this.cameraMode}`);
        
        // Update the mode indicator
        this.modeIndicator.updateMode(this.cameraMode);
        
        // Notify listeners about camera change
        this.notifyCameraChange();
    }
    
    // Set the target for the camera to follow
    setTarget(target) {
        this.target = target;
    }
    
    // Update camera position to follow target
    update() {
        // Update controls
        this.controls.update();
        
        // Follow target if set
        if (this.target && this.target.mesh) {
            // Calculate target position (with offset)
            const targetPosition = new THREE.Vector3();
            targetPosition.copy(this.target.mesh.position);
            
            // Calculate desired camera position
            const desiredPosition = new THREE.Vector3();
            desiredPosition.copy(targetPosition).add(this.offset);
            
            // Directly set camera position to follow target exactly
            this.camera.position.copy(desiredPosition);
            
            // Make camera look at the target
            this.camera.lookAt(targetPosition);
            
            // Also update the inactive camera to maintain consistency when switching
            const inactiveCamera = (this.cameraMode === 'perspective') ? 
                this.orthographicCamera : this.perspectiveCamera;
            inactiveCamera.position.copy(this.camera.position);
            inactiveCamera.lookAt(targetPosition);
        }
    }
    
    // Handle window resize
    onWindowResize() {
        const newAspect = window.innerWidth / window.innerHeight;
        this.aspect = newAspect;
        
        // Update perspective camera
        this.perspectiveCamera.aspect = newAspect;
        this.perspectiveCamera.updateProjectionMatrix();
        
        // Update orthographic camera
        const frustumSize = OrthographicSettings.FRUSTUM_SIZE;
        this.orthographicCamera.left = frustumSize * newAspect / -2;
        this.orthographicCamera.right = frustumSize * newAspect / 2;
        this.orthographicCamera.top = frustumSize / 2;
        this.orthographicCamera.bottom = frustumSize / -2;
        this.orthographicCamera.updateProjectionMatrix();
    }
    
    // Get the THREE.js camera object
    getCamera() {
        return this.camera;
    }
    
    // Register a callback for camera changes
    onCameraChange(callback) {
        if (typeof callback === 'function') {
            this.onCameraChangeCallbacks.push(callback);
        }
    }
    
    // Notify all registered callbacks about camera change
    notifyCameraChange() {
        for (const callback of this.onCameraChangeCallbacks) {
            callback(this.camera);
        }
    }
    
    // Get the controls
    getControls() {
        return this.controls;
    }
}

export { Camera };
