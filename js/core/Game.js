import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from '../entities/Water.js';
import { Island } from '../entities/Island.js';
import { Character } from '../entities/Character.js';
import { InputController } from '../controls/InputController.js';

class Game {
    constructor() {
        // Initialize properties
        this.container = document.getElementById('game-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        // Game entities
        this.water = null;
        this.island = null;
        this.character = null;
        
        // Controls
        this.inputController = null;
        
        // Setup and start the game
        this.init();
        this.animate();
    }
    
    init() {
        this.createScene();
        this.createRenderer();
        this.createCamera();
        this.createLights();
        
        // Create game entities
        this.water = new Water();
        this.scene.add(this.water.mesh);
        
        this.island = new Island(100, 1); // Create island with 100 cubes and 1 unit cube size
        this.island.addToScene(this.scene);
        
        this.character = new Character();
        this.scene.add(this.character.mesh);
        
        // Setup controls
        this.inputController = new InputController(this.character);
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        // Position camera parallel to the island surface
        this.camera.position.set(0, 15, 30); // Position camera from the front
        this.camera.lookAt(0, 0, 0);
        
        // Add orbit controls with restrictions
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Disable camera rotation/movement but keep zoom functionality
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        
        // Set zoom limits
        this.controls.minDistance = 10;
        this.controls.maxDistance = 50;
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }
    
    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 200, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        // Update entities
        if (this.water) this.water.update(deltaTime);
        if (this.character) this.character.update(deltaTime, this.camera);
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

export { Game };
