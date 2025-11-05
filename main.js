import SceneManager from './scene.js';
import WeatherManager from './weather.js';
import PostMessageManager from './postMessage.js';
import UIManager from './ui.js';

const canvas = document.querySelector('#bg');
const sceneManager = new SceneManager(canvas);
const weatherManager = new WeatherManager();
const postMessageManager = new PostMessageManager(window.parent);
const uiManager = new UIManager();

function updateAndPostWeather() {
    weatherManager.changeWeather();
    const weatherData = weatherManager.getCurrentWeather();
    
    // Update the iframe's own UI
    uiManager.updateUI(weatherData);

    // Update 3D scene only if local rendering is enabled
    if (uiManager.isLocalRenderingEnabled()) {
        sceneManager.updateWeather(weatherData);
    }

    // Send the weather data to the parent window
    const mode = uiManager.getPostMode();
    const message = weatherManager.createPostMessage(mode);
    postMessageManager.sendMessage(message);
}

function handleLocalRenderToggle() {
    const isEnabled = uiManager.isLocalRenderingEnabled();
    sceneManager.setRendering(isEnabled);
    if (isEnabled) {
        // If turning on, sync scene with current weather
        const weatherData = weatherManager.getCurrentWeather();
        sceneManager.updateWeather(weatherData);
    }
}

// Initial setup
const initialWeather = weatherManager.getCurrentWeather();
uiManager.updateUI(initialWeather);

if (uiManager.isLocalRenderingEnabled()) {
    sceneManager.updateWeather(initialWeather);
} else {
    sceneManager.setRendering(false);
}

uiManager.onChangeWeather(updateAndPostWeather);
uiManager.onLocalRenderToggle(handleLocalRenderToggle);

function animate() {
    requestAnimationFrame(animate);
    if (uiManager.isLocalRenderingEnabled()) {
        sceneManager.animate();
    }
}

animate();

// Let the parent know the iframe is ready
window.addEventListener('load', () => {
    postMessageManager.sendMessage({ type: 'IFRAME_READY' });
});