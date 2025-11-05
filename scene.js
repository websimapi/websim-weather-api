import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.clock = new THREE.Clock();
        this.wind = { speed: 0, direction: new THREE.Vector3(0,0,0) };

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);
        this.namedObjects.set('ambientLight', ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.scene.add(sunLight);
        this.namedObjects.set('sunLight', sunLight);

        const moonLight = new THREE.DirectionalLight(0xeeeeff, 0.2);
        this.scene.add(moonLight);
        this.namedObjects.set('moonLight', moonLight);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(30, 20, -50);
        this.scene.add(sun);
        this.namedObjects.set('sun', sun);

        // Moon
        const moonGeometry = new THREE.SphereGeometry(2.5, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xd3d3d3 });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.scene.add(moon);
        this.namedObjects.set('moon', moon);

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
            if (name !== 'ground' && name !== 'sun' && name !== 'moon' && name !== 'sunLight' && name !== 'moonLight' && name !== 'ambientLight') {
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

    updateTimeOfDay(timeOfDay) {
        // timeOfDay is 0-24
        const angle = ((timeOfDay - 6) / 24) * 2 * Math.PI; // Full circle in 24h, offset so 6am is sunrise
        const radius = 100;

        const sun = this.namedObjects.get('sun');
        const sunLight = this.namedObjects.get('sunLight');
        sun.position.x = Math.cos(angle) * radius;
        sun.position.y = Math.sin(angle) * radius;
        sun.position.z = -50;
        sunLight.position.copy(sun.position);

        const moon = this.namedObjects.get('moon');
        const moonLight = this.namedObjects.get('moonLight');
        moon.position.x = -sun.position.x;
        moon.position.y = -sun.position.y;
        moon.position.z = -50;
        moonLight.position.copy(moon.position);

        sun.visible = sun.position.y > -10;
        sunLight.intensity = Math.max(0, sun.position.y / radius) * 1.5;
        
        moon.visible = moon.position.y > -10;
        moonLight.intensity = Math.max(0, moon.position.y / radius) * 0.2;

        const ambientLight = this.namedObjects.get('ambientLight');
        ambientLight.intensity = Math.max(0.1, (sun.position.y + radius*0.2) / (radius * 1.2)) * 0.4;

        const dayColor = new THREE.Color(0x87CEEB);
        const nightColor = new THREE.Color(0x000033);
        const t = Math.max(0, sun.position.y / radius);
        this.scene.background = new THREE.Color().lerpColors(nightColor, dayColor, t);
    }

    updateWeather(weatherData) {
        this.wind.speed = weatherData.wind.speed;
        this.wind.direction.set(weatherData.wind.direction.x, weatherData.wind.direction.y, weatherData.wind.direction.z);
        this.updateTimeOfDay(weatherData.timeOfDay);
        
        this.clearDynamicElements();

        switch (weatherData.condition) {
            case 'Sunny':
                // Handled by updateTimeOfDay
                break;
            case 'Rainy':
                this.addParticleSystem('rain', 0xADD8E6, 500);
                break;
            case 'Snowy':
                this.addParticleSystem('snow', 0xFFFFFF, 500);
                break;
            default:
                // Default to sunny
        }
    }

    animate() {
        if (!this.isRendering) return;
        const delta = this.clock.getDelta();

        this.controls.update();

        this.namedObjects.forEach((obj) => {
            if (obj.userData.isParticleSystem) {
                const positions = obj.geometry.attributes.position.array;
                const windEffect = this.wind.direction.clone().multiplyScalar(this.wind.speed * delta);
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += windEffect.x;
                    positions[i+1] -= 0.1 + Math.random() * 0.1; // Gravity + some randomness
                    positions[i+2] += windEffect.z;
                    
                    if (positions[i+1] < -10) {
                        positions[i] = Math.random() * 200 - 100;
                        positions[i+1] = 100; // Reset to top
                        positions[i+2] = Math.random() * 100 - 50;
                    }
                }
                obj.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

export default SceneManager;