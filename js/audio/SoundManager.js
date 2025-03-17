class SoundManager {
    constructor() {
        this.sounds = {};
        this.initialized = false;
        this.volume = 0.5; // Default volume
    }
    
    init() {
        if (this.initialized) return;
        
        // Load splash sound effects
        this.loadSound('splash_up', 'assets/audio/splash_up.mp3');
        this.loadSound('splash_down', 'assets/audio/splash_down.mp3');
        
        // Add a note about audio files
        console.log('Audio files should be placed in assets/audio/ directory');
        console.log('Required files: splash_up.mp3, splash_down.mp3');
        
        this.initialized = true;
    }
    
    loadSound(name, url) {
        try {
            const audio = new Audio(url);
            audio.volume = this.volume;
            this.sounds[name] = audio;
            
            // Add error handler to detect missing files
            audio.addEventListener('error', (e) => {
                console.warn(`Could not load sound: ${name} from ${url}`, e);
                // Create a silent audio element as a fallback
                this.createSilentFallback(name);
            });
        } catch (e) {
            console.warn(`Error loading sound: ${name}`, e);
            // Create a silent audio element as a fallback
            this.createSilentFallback(name);
        }
    }
    
    createSilentFallback(name) {
        // Create an empty audio context as a fallback
        console.log(`Creating silent fallback for sound: ${name}`);
        const silentAudio = new Audio();
        silentAudio.volume = 0;
        this.sounds[name] = silentAudio;
    }
    
    play(name, options = {}) {
        if (!this.initialized) this.init();
        
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound '${name}' not found`);
            return;
        }
        
        // Skip playing if the sound had an error or is a fallback
        if (sound.error || sound._isFallback) {
            return;
        }
        
        // Apply options
        if (options.volume !== undefined) {
            sound.volume = options.volume * this.volume;
        } else {
            sound.volume = this.volume;
        }
        
        // Clone the audio to allow multiple simultaneous plays
        const soundClone = sound.cloneNode();
        
        // Apply random pitch if specified
        if (options.randomPitch) {
            const minPitch = options.minPitch || 0.8;
            const maxPitch = options.maxPitch || 1.2;
            const randomPitch = minPitch + Math.random() * (maxPitch - minPitch);
            soundClone.playbackRate = randomPitch;
        }
        
        // Play the sound
        soundClone.play().catch(e => {
            // Handle autoplay restrictions
            console.warn('Could not play sound:', e);
        });
        
        return soundClone;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all loaded sounds
        for (const name in this.sounds) {
            this.sounds[name].volume = this.volume;
        }
    }
}

// Create a singleton instance
const soundManager = new SoundManager();

export { soundManager };
