/**
 * Camera configuration settings
 * This file contains all camera-related configuration variables
 * for easy adjustment and maintenance.
 */

// Default camera mode to use when the game starts
// Valid values: 'perspective' or 'orthographic'
const DEFAULT_CAMERA_MODE = 'orthographic';

import * as THREE from 'three';

// Common camera settings
const CommonSettings = {
    // Near and far clipping planes
    NEAR_PLANE: 0.1,
    FAR_PLANE: 1000,
    
    // Camera control settings
    ENABLE_DAMPING: true,
    DAMPING_FACTOR: 0.05,
    ENABLE_ROTATE: false,
    ENABLE_PAN: false,
    ENABLE_ZOOM: true,
    MIN_ZOOM_DISTANCE: 10,
    MAX_ZOOM_DISTANCE: 50,
    
    // Camera follow settings
    SMOOTH_FACTOR: 1.0, // 1.0 = no smoothing, lower values add smoothing
};

// Perspective camera settings
const PerspectiveSettings = {
    // Field of view in degrees
    FOV: 35,
    
    // Initial position and offset
    INITIAL_POSITION: new THREE.Vector3(0, 15, 30),
    FOLLOW_OFFSET: new THREE.Vector3(0, 15, 30),
};

// Orthographic camera settings
const OrthographicSettings = {
    // Frustum size (controls the size of the viewing volume)
    FRUSTUM_SIZE: 25,
    
    // Initial position and offset
    INITIAL_POSITION: new THREE.Vector3(0, 10, 15),
    FOLLOW_OFFSET: new THREE.Vector3(0, 10, 15),
};

// Camera mode indicator settings
const IndicatorSettings = {
    FADE_DELAY: 3000, // Time in ms before the indicator fades
    FADE_OPACITY: 0.3, // Opacity level after fading
};

// Export all settings
export {
    DEFAULT_CAMERA_MODE,
    CommonSettings,
    PerspectiveSettings,
    OrthographicSettings,
    IndicatorSettings
};
