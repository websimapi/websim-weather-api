import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.namedObjects = new Map();
        this.isRendering = true;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.camera.position.set(0, 5, 20);
        this.controls.update();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(30, 20, -50);
        this.scene.add(sun);
        this.namedObjects.set('sun', sun);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -10;
        this.scene.add(ground);
        this.namedObjects.set('ground', ground);

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    setRendering(isEnabled) {
        this.isRendering = isEnabled;
        this.canvas.style.display = isEnabled ? 'block' : 'none';
    }

    clearDynamicElements() {
        const toRemove = [];
        this.namedObjects.forEach((obj, name) => {
            if (name !== 'ground' && name !== 'sun') {
                toRemove.push(obj);
            }
        });
        toRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
            this.namedObjects.forEach((val, key) => {
                if (val === obj) this.namedObjects.delete(key);
            });
        });
    }

    addParticleSystem(name, color, count) {
        if (this.namedObjects.has(name)) return;

        const vertices = [];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 200 - 100;
            const y = Math.random() * 100;
            const z = Math.random() * 100 - 50;
            vertices.push(x, y, z);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color, size: 0.5, transparent: true });
        const particles = new THREE.Points(geometry, material);
        particles.userData.isParticleSystem = true;

        this.namedObjects.set(name, particles);
        this.scene.add(particles);
    }

    updateWeather(weatherData) {
        const sun = this.namedObjects.get('sun');
        this.clearDynamicElements();

        switch (weatherData.condition) {
            case 'Sunny':
                this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
                if (sun) sun.visible = true;
                break;
            case 'Rainy':
                this.scene.background = new THREE.Color(0x778899); // Light slate gray
                if (sun) sun.visible = false;
                this.addParticleSystem('rain', 0xADD8E6, 500);
                break;
            case 'Snowy':
                this.scene.background = new THREE.Color(0xDCDCDC); // Gainsboro
                if (sun) sun.visible = false;
                this.addParticleSystem('snow', 0xFFFFFF, 500);
                break;
            default:
                this.scene.background = new THREE.Color(0x87CEEB);
                if (sun) sun.visible = true;
        }
    }

    animate() {
        if (!this.isRendering) return;

        this.controls.update();

        this.namedObjects.forEach((obj) => {
            if (obj.userData.isParticleSystem) {
                const positions = obj.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] -= 0.1; // Move down
                    if (positions[i] < -10) {
                        positions[i] = 100; // Reset to top
                    }
                }
                obj.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

export default SceneManager;