import * as THREE from 'three';
import { Water } from '../entities/Water.js';
import { Island } from '../entities/Island.js';
import { Character } from '../entities/Character.js';
import { InputController } from '../controls/InputController.js';
import { Camera } from './Camera.js';
import { soundManager } from '../audio/SoundManager.js';

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
        
        // Initialize sound manager
        soundManager.init();
        
        // Create game entities
        this.water = new Water();
        this.scene.add(this.water.mesh);
        
        this.island = new Island(100, 1); // Create island with 100 cubes and 1 unit cube size
        this.island.addToScene(this.scene);
        
        this.character = new Character();
        this.scene.add(this.character.mesh);
        this.scene.add(this.character.raft.mesh); // Add raft to scene
        this.scene.add(this.character.raft.splashEffect.mesh); // Add splash effect to scene
        
        // Set character as the camera target
        this.cameraController.setTarget(this.character);
        
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
        // Create camera instance with renderer
        this.cameraController = new Camera(this.renderer);
        // Get the THREE.js camera object
        this.camera = this.cameraController.getCamera();
        
        // Listen for camera changes
        this.cameraController.onCameraChange((newCamera) => {
            this.camera = newCamera;
            console.log('Game: Camera reference updated');
        });
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
        // Улучшенное окружающее освещение - повышена интенсивность
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // Добавляем полусферическое освещение для более естественного и насыщенного освещения
        // Верхний цвет - голубоватый, нижний - теплый
        const hemisphereLight = new THREE.HemisphereLight(0x80b5ff, 0xffd700, 0.6);
        this.scene.add(hemisphereLight);
        
        // Улучшенное направленное освещение - повышена интенсивность и теплее цвет
        const directionalLight = new THREE.DirectionalLight(0xffffcc, 1.2);
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
        this.cameraController.onWindowResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        // Update entities
        if (this.water) this.water.update(deltaTime);
        if (this.character) this.character.update(deltaTime, this.camera, this.island);
        if (this.island && this.island.palm) this.island.palm.update(this.camera);
        
        // Update camera (includes controls update)
        this.cameraController.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

export { Game };
