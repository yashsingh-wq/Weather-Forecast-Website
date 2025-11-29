// API Configuration
const API_KEY = 'dff120b7911e9421aab360d50d3175bc'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const refreshBtn = document.getElementById('refresh-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const unitBtns = document.querySelectorAll('.unit-btn');
const themeBtns = document.querySelectorAll('.theme-btn');
const radarBtns = document.querySelectorAll('.radar-btn');
const loading = document.getElementById('loading');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const closeError = document.getElementById('close-error');
const apiStatus = document.getElementById('api-status');
const lastUpdate = document.getElementById('last-update');

// Weather Data Elements
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTime = document.getElementById('current-time');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const cloudiness = document.getElementById('cloudiness');
const uvIndex = document.getElementById('uv-index');
const forecastContainer = document.getElementById('forecast-container');
const hourlyContainer = document.getElementById('hourly-container');
const aqiValue = document.getElementById('aqi-value');
const aqiLevel = document.getElementById('aqi-level');
const pm25 = document.getElementById('pm25');
const pm10 = document.getElementById('pm10');
const o3 = document.getElementById('o3');
const no2 = document.getElementById('no2');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const dayLength = document.getElementById('day-length');
const moonPhase = document.getElementById('moon-phase');
const rainChance = document.getElementById('rain-chance');
const precipitation = document.getElementById('precipitation');
const rainVolume = document.getElementById('rain-volume');
const snowVolume = document.getElementById('snow-volume');
const alertsContainer = document.getElementById('alerts-container');
const newsContainer = document.getElementById('news-container');
const legendTitle = document.getElementById('legend-title');
const legendGradient = document.getElementById('legend-gradient');
const aqiUpdate = document.getElementById('aqi-update');

// Global Variables
let currentUnit = 'metric';
let currentCity = 'New York';
let currentTheme = 'sunrise';
let currentMapLayer = 'precipitation';
let weatherMap;
let mapLayers = {};
let lastUpdateTime = new Date();
let autoRefreshInterval;
let currentCoordinates = { lat: 40.7128, lon: -74.0060 }; // Default to New York

// Weather News Data
const weatherNews = [
    {
        title: "Heatwave Expected to Continue Through the Weekend",
        summary: "Meteorologists predict temperatures will remain above average for the next several days with increased UV radiation levels.",
        date: new Date().toLocaleDateString(),
        source: "National Weather Service"
    },
    {
        title: "New Climate Model Shows Faster Warming Trends",
        summary: "Latest research indicates global temperatures may rise more rapidly than previously estimated.",
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        source: "Climate Research Journal"
    },
    {
        title: "Hurricane Season Forecast Updated",
        summary: "Experts increase predicted storm activity for the current hurricane season.",
        date: new Date(Date.now() - 172800000).toLocaleDateString(),
        source: "NOAA"
    }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load default city weather
    getWeatherData(currentCity);
    
    // Initialize map
    initMap();
    
    // Load news and set up auto-refresh
    loadNews();
    setupAutoRefresh();
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000); // Update every second for real-time
    
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Location button
    locationBtn.addEventListener('click', getLocationWeather);
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.animation = 'rotate 1s linear';
        setTimeout(() => {
            refreshBtn.style.animation = '';
        }, 1000);
        getWeatherData(currentCity);
    });
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Unit toggle
    unitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const unit = btn.dataset.unit;
            if (unit !== currentUnit) {
                currentUnit = unit;
                unitBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateUnits();
                getWeatherData(currentCity);
            }
        });
    });
    
    // Theme toggle
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            currentTheme = theme;
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            changeTheme(theme);
        });
    });
    
    // Radar layer toggle
    radarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;
            currentMapLayer = layer;
            radarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchMapLayer(layer);
        });
    });
    
    // Close error modal
    closeError.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });
    
    // Check API status
    checkAPIStatus();
});

// Functions
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update cloud visibility based on theme
    const clouds = document.querySelectorAll('.cloud');
    if (theme === 'night') {
        clouds.forEach(cloud => cloud.style.opacity = '0.3');
    } else {
        clouds.forEach(cloud => cloud.style.opacity = '0.8');
    }
}

function initMap() {
    // Initialize Leaflet map
    weatherMap = L.map('weather-map').setView([currentCoordinates.lat, currentCoordinates.lon], 6);
    
    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(weatherMap);
    
    // Initialize map layers
    initMapLayers();
}

function initMapLayers() {
    // Precipitation layer
    mapLayers.precipitation = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={apiKey}', {
        apiKey: API_KEY,
        attribution: '© OpenWeatherMap',
        opacity: 0.7
    });
    
    // Clouds layer
    mapLayers.clouds = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={apiKey}', {
        apiKey: API_KEY,
        attribution: '© OpenWeatherMap',
        opacity: 0.7
    });
    
    // Temperature layer
    mapLayers.temperature = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={apiKey}', {
        apiKey: API_KEY,
        attribution: '© OpenWeatherMap',
        opacity: 0.7
    });
    
    // Wind layer
    mapLayers.wind = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid={apiKey}', {
        apiKey: API_KEY,
        attribution: '© OpenWeatherMap',
        opacity: 0.7
    });
    
    // Pressure layer
    mapLayers.pressure = L.tileLayer('https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid={apiKey}', {
        apiKey: API_KEY,
        attribution: '© OpenWeatherMap',
        opacity: 0.7
    });
    
    // Add default layer
    mapLayers.precipitation.addTo(weatherMap);
    updateLegend('precipitation');
}

function switchMapLayer(layer) {
    // Remove all layers
    Object.values(mapLayers).forEach(layer => {
        weatherMap.removeLayer(layer);
    });
    
    // Add selected layer
    if (mapLayers[layer]) {
        mapLayers[layer].addTo(weatherMap);
    }
    
    updateLegend(layer);
}

function updateLegend(layer) {
    let title, gradient;
    
    switch(layer) {
        case 'precipitation':
            title = 'Precipitation Intensity';
            gradient = 'linear-gradient(to right, #ffffff, #87ceeb, #0000ff, #ff00ff, #ff0000)';
            break;
        case 'clouds':
            title = 'Cloud Coverage';
            gradient = 'linear-gradient(to right, #ffffff, #d3d3d3, #a9a9a9, #696969)';
            break;
        case 'temperature':
            title = 'Temperature';
            gradient = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
            break;
        case 'wind':
            title = 'Wind Speed';
            gradient = 'linear-gradient(to right, #ffffff, #ffff00, #ffa500, #ff0000)';
            break;
        case 'pressure':
            title = 'Atmospheric Pressure';
            gradient = 'linear-gradient(to right, #0000ff, #00ffff, #ffffff, #ffff00, #ff0000)';
            break;
    }
    
    legendTitle.textContent = title;
    legendGradient.style.background = gradient;
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        getWeatherData(query);
        searchInput.value = '';
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataByCoords(lat, lon);
            },
            error => {
                hideLoading();
                showError('Unable to retrieve your location. Please check location permissions.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

async function getWeatherData(city) {
    showLoading();
    try {
        // Get current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Update current city and coordinates
        currentCity = currentWeatherData.name;
        currentCoordinates = {
            lat: currentWeatherData.coord.lat,
            lon: currentWeatherData.coord.lon
        };
        
        // Update map view
        weatherMap.setView([currentCoordinates.lat, currentCoordinates.lon], 8);
        
        // Get forecast data
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=${currentUnit}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Forecast data unavailable');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Get air quality data
        const airQualityResponse = await fetch(
            `${BASE_URL}/air_pollution?lat=${currentCoordinates.lat}&lon=${currentCoordinates.lon}&appid=${API_KEY}`
        );
        
        let airQualityData = null;
        if (airQualityResponse.ok) {
            airQualityData = await airQualityResponse.json();
        }
        
        // Get UV index data from Open-Meteo
        const uvResponse = await fetch(
            `${OPEN_METEO_URL}/forecast?latitude=${currentCoordinates.lat}&longitude=${currentCoordinates.lon}&daily=uv_index_max&timezone=auto`
        );
        
        let uvData = null;
        if (uvResponse.ok) {
            uvData = await uvResponse.json();
        }
        
        // Get weather alerts
        const alertsResponse = await fetch(
            `${BASE_URL}/onecall?lat=${currentCoordinates.lat}&lon=${currentCoordinates.lon}&exclude=minutely,hourly,daily&appid=${API_KEY}`
        );
        
        let alertsData = null;
        if (alertsResponse.ok) {
            alertsData = await alertsResponse.json();
        }
        
        // Update UI with all data
        updateCurrentWeather(currentWeatherData, uvData);
        updateForecast(forecastData);
        updateHourlyForecast(forecastData);
        updateAdditionalInfo(currentWeatherData, airQualityData);
        updateAlerts(alertsData);
        
        // Update last update time
        lastUpdateTime = new Date();
        updateLastUpdateTime();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

async function getWeatherDataByCoords(lat, lon) {
    showLoading();
    try {
        // Get current weather by coordinates
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Weather data unavailable for your location');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Update current city and coordinates
        currentCity = currentWeatherData.name;
        currentCoordinates = { lat, lon };
        
        // Update map view
        weatherMap.setView([lat, lon], 8);
        
        // Get forecast data
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Forecast data unavailable');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Get air quality data
        const airQualityResponse = await fetch(
            `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        
        let airQualityData = null;
        if (airQualityResponse.ok) {
            airQualityData = await airQualityResponse.json();
        }
        
        // Get UV index data from Open-Meteo
        const uvResponse = await fetch(
            `${OPEN_METEO_URL}/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto`
        );
        
        let uvData = null;
        if (uvResponse.ok) {
            uvData = await uvResponse.json();
        }
        
        // Get weather alerts
        const alertsResponse = await fetch(
            `${BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${API_KEY}`
        );
        
        let alertsData = null;
        if (alertsResponse.ok) {
            alertsData = await alertsResponse.json();
        }
        
        // Update UI with all data
        updateCurrentWeather(currentWeatherData, uvData);
        updateForecast(forecastData);
        updateHourlyForecast(forecastData);
        updateAdditionalInfo(currentWeatherData, airQualityData);
        updateAlerts(alertsData);
        
        // Update last update time
        lastUpdateTime = new Date();
        updateLastUpdateTime();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

function updateCurrentWeather(data, uvData) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = formatDate(new Date());
    currentTemp.textContent = Math.round(data.main.temp);
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherDesc.textContent = data.weather[0].description;
    feelsLike.textContent = Math.round(data.main.feels_like);
    
    // Update weather details
    const speedUnit = currentUnit === 'metric' ? 'km/h' : 'mph';
    const speedValue = currentUnit === 'metric' 
        ? (data.wind.speed * 3.6).toFixed(1) 
        : (data.wind.speed * 2.237).toFixed(1);
    
    windSpeed.textContent = `${speedValue} ${speedUnit}`;
    humidity.textContent = `${data.main.humidity}%`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    cloudiness.textContent = `${data.clouds.all}%`;
    
    // Update UV index if available
    if (uvData && uvData.daily && uvData.daily.uv_index_max) {
        uvIndex.textContent = Math.round(uvData.daily.uv_index_max[0]);
    } else {
        uvIndex.textContent = '--';
    }
}

function updateForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Group forecast by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyForecasts[day].temps.push(item.main.temp);
        dailyForecasts[day].icons.push(item.weather[0].icon);
        dailyForecasts[day].descriptions.push(item.weather[0].description);
    });
    
    // Create forecast items for the next 5 days
    const days = Object.keys(dailyForecasts).slice(0, 5);
    
    days.forEach(day => {
        const dayData = dailyForecasts[day];
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const minTemp = Math.round(Math.min(...dayData.temps));
        
        // Use the most common icon for the day
        const iconCounts = {};
        let maxCount = 0;
        let mostCommonIcon = dayData.icons[0];
        
        dayData.icons.forEach(icon => {
            iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            if (iconCounts[icon] > maxCount) {
                maxCount = iconCounts[icon];
                mostCommonIcon = icon;
            }
        });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item glass-card';
        forecastItem.innerHTML = `
            <div class="forecast-day">${day}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${mostCommonIcon}.png" alt="Weather Icon">
            <div class="forecast-temp">
                <span class="temp-high">${maxTemp}°</span>
                <span class="temp-low">${minTemp}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

function updateHourlyForecast(data) {
    // Clear previous hourly forecast
    hourlyContainer.innerHTML = '';
    
    // Get next 24 hours of forecast (8 items, 3-hour intervals)
    const hourlyData = data.list.slice(0, 8);
    
    hourlyData.forEach(item => {
        const time = new Date(item.dt * 1000);
        const hour = time.getHours();
        const displayTime = hour === 0 ? '12AM' : 
                           hour < 12 ? `${hour}AM` : 
                           hour === 12 ? '12PM' : 
                           `${hour - 12}PM`;
        
        const temp = Math.round(item.main.temp);
        const icon = item.weather[0].icon;
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item glass-card';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${displayTime}</div>
            <img class="hourly-icon" src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
            <div class="hourly-temp">${temp}°</div>
        `;
        
        hourlyContainer.appendChild(hourlyItem);
    });
}

function updateAdditionalInfo(currentData, airQualityData) {
    // Update sunrise and sunset
    const sunriseTime = new Date(currentData.sys.sunrise * 1000);
    const sunsetTime = new Date(currentData.sys.sunset * 1000);
    
    sunrise.textContent = formatTime(sunriseTime);
    sunset.textContent = formatTime(sunsetTime);
    
    // Calculate day length
    const dayLengthMs = sunsetTime - sunriseTime;
    const dayLengthHours = Math.floor(dayLengthMs / (1000 * 60 * 60));
    const dayLengthMinutes = Math.floor((dayLengthMs % (1000 * 60 * 60)) / (1000 * 60));
    dayLength.textContent = `${dayLengthHours}h ${dayLengthMinutes}m`;
    
    // Simple moon phase calculation (approximate)
    const moonPhases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
                       'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const phaseIndex = Math.floor((new Date().getDate() / 30) * 8) % 8;
    moonPhase.textContent = moonPhases[phaseIndex];
    
    // Update precipitation (using rain data if available)
    if (currentData.rain) {
        const rainAmount = currentData.rain['1h'] || currentData.rain['3h'] || 0;
        precipitation.textContent = `${rainAmount} mm`;
        rainVolume.textContent = `${rainAmount} mm`;
        rainChance.textContent = '50%'; // This would require more detailed data
    } else {
        precipitation.textContent = '0 mm';
        rainVolume.textContent = '0 mm';
        rainChance.textContent = '10%';
    }
    
    // Update snow data if available
    if (currentData.snow) {
        const snowAmount = currentData.snow['1h'] || currentData.snow['3h'] || 0;
        snowVolume.textContent = `${snowAmount} mm`;
    } else {
        snowVolume.textContent = '0 mm';
    }
    
    // Update air quality if available
    if (airQualityData && airQualityData.list.length > 0) {
        const aqi = airQualityData.list[0].main.aqi;
        const components = airQualityData.list[0].components;
        
        aqiValue.textContent = aqi;
        
        // Set AQI level and color
        let level, color;
        switch(aqi) {
            case 1: level = 'Good'; color = '#4fd1c5'; break;
            case 2: level = 'Fair'; color = '#68d391'; break;
            case 3: level = 'Moderate'; color = '#f6e05e'; break;
            case 4: level = 'Poor'; color = '#f6ad55'; break;
            case 5: level = 'Very Poor'; color = '#fc8181'; break;
            default: level = 'Unknown'; color = '#a0aec0';
        }
        
        aqiLevel.textContent = level;
        aqiValue.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
        
        // Update pollutant levels
        pm25.textContent = `${components.pm2_5.toFixed(1)} μg/m³`;
        pm10.textContent = `${components.pm10.toFixed(1)} μg/m³`;
        o3.textContent = `${components.o3.toFixed(1)} μg/m³`;
        no2.textContent = `${components.no2.toFixed(1)} μg/m³`;
        
        // Update AQI update time
        aqiUpdate.textContent = 'Updated: Just now';
    } else {
        // Default values if air quality data is unavailable
        aqiValue.textContent = '--';
        aqiLevel.textContent = 'Unknown';
        aqiValue.style.background = 'linear-gradient(135deg, #a0aec0, #a0aec0dd)';
        pm25.textContent = '-- μg/m³';
        pm10.textContent = '-- μg/m³';
        o3.textContent = '-- μg/m³';
        no2.textContent = '-- μg/m³';
        aqiUpdate.textContent = 'Updated: --';
    }
}

function updateAlerts(alertsData) {
    // Clear previous alerts
    alertsContainer.innerHTML = '';
    
    if (alertsData && alertsData.alerts) {
        alertsData.alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <h3><i class="fas fa-exclamation-triangle"></i> ${alert.event}</h3>
                <p>${alert.description}</p>
                <div class="alert-meta">
                    <span>From: ${formatDateTime(new Date(alert.start * 1000))}</span>
                    <span>To: ${formatDateTime(new Date(alert.end * 1000))}</span>
                </div>
            `;
            alertsContainer.appendChild(alertItem);
        });
    } else {
        alertsContainer.innerHTML = '<p class="no-alerts" style="color: rgba(255,255,255,0.7); text-align: center; padding: 20px;">No active weather alerts</p>';
    }
}

function loadNews() {
    newsContainer.innerHTML = '';
    
    weatherNews.forEach(news => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item glass-card';
        newsItem.innerHTML = `
            <h3>${news.title}</h3>
            <p>${news.summary}</p>
            <div class="news-meta">
                <span>${news.source}</span>
                <span>${news.date}</span>
            </div>
        `;
        newsContainer.appendChild(newsItem);
    });
}

function updateTime() {
    const now = new Date();
    currentTime.textContent = formatTime(now);
    
    // Auto-switch theme based on time
    const hour = now.getHours();
    if (hour >= 18 || hour < 6) {
        // Night theme
        if (currentTheme !== 'night') {
            changeTheme('night');
            themeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === 'night');
            });
            currentTheme = 'night';
        }
    } else if (hour >= 6 && hour < 12) {
        // Sunrise theme
        if (currentTheme !== 'sunrise') {
            changeTheme('sunrise');
            themeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === 'sunrise');
            });
            currentTheme = 'sunrise';
        }
    }
}

function updateUnits() {
    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    document.querySelectorAll('.unit').forEach(el => {
        el.textContent = unitSymbol;
    });
}

function updateLastUpdateTime() {
    const now = new Date();
    const diffMs = now - lastUpdateTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    let timeText;
    if (diffMins < 1) {
        timeText = 'Just now';
    } else if (diffMins === 1) {
        timeText = '1 minute ago';
    } else {
        timeText = `${diffMins} minutes ago`;
    }
    
    lastUpdate.textContent = `Last updated: ${timeText}`;
}

function setupAutoRefresh() {
    // Refresh data every 10 minutes
    autoRefreshInterval = setInterval(() => {
        getWeatherData(currentCity);
    }, 600000); // 10 minutes
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

async function checkAPIStatus() {
    try {
        const response = await fetch(`${BASE_URL}/weather?q=London&appid=${API_KEY}`);
        if (response.ok) {
            apiStatus.textContent = 'Online';
            apiStatus.style.color = '#4fd1c5';
        } else {
            apiStatus.textContent = 'Limited';
            apiStatus.style.color = '#f6ad55';
        }
    } catch (error) {
        apiStatus.textContent = 'Offline';
        apiStatus.style.color = '#fc8181';
    }
}

// Utility Functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('en-US', options);
}

function formatDateTime(date) {
    const options = { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    };
    return date.toLocaleDateString('en-US', options);
}

function showLoading() {
    loading.style.display = 'flex';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
}

// Demo data for when API key is not provided
function loadDemoData() {
    console.log('Demo mode: No API key provided');
    // In a real implementation, you would load sample data here
}

// Initialize the app
if (API_KEY === 'dff120b7911e9421aab360d50d3175bc') {
    console.warn('Please add your OpenWeatherMap API key to use real weather data');
    loadDemoData();
}

// Handle page visibility changes for efficiency
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, reduce refresh frequency
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = setInterval(() => {
            getWeatherData(currentCity);
        }, 1800000); // 30 minutes when not visible
    } else {
        // Page is visible, resume normal refresh
        clearInterval(autoRefreshInterval);
        setupAutoRefresh();
        // Refresh data immediately when page becomes visible
        getWeatherData(currentCity);
    }
});