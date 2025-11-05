class UIManager {
    constructor() {
        this.conditionEl = document.getElementById('condition');
        this.temperatureEl = document.getElementById('temperature');
        this.changeBtn = document.getElementById('change-weather-btn');
        this.postModeSelect = document.getElementById('post-mode');
        this.localRenderToggle = document.getElementById('local-render-toggle');
    }

    updateUI(weatherData) {
        this.conditionEl.textContent = weatherData.condition;
        this.temperatureEl.textContent = weatherData.temperature;
    }

    onChangeWeather(callback) {
        this.changeBtn.addEventListener('click', callback);
    }
    
    getPostMode() {
        return this.postModeSelect.value;
    }

    isLocalRenderingEnabled() {
        return this.localRenderToggle.checked;
    }

    onLocalRenderToggle(callback) {
        this.localRenderToggle.addEventListener('change', callback);
    }
}

export default UIManager;

