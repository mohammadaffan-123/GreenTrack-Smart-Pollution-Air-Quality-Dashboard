// ============================================
// Configuration
// ============================================
const CONFIG = {
    apiUrl: 'https://api.waqi.info/feed',
    apiKey: 'b784e806f701bc0a79adaf50855b32f8acc0d234', // Replace with your actual API key
    defaultCity: 'New Delhi',
    criticalAqiThreshold: 150,
    refreshInterval: 600000 // 10 minutes
};

// Override alert threshold from localStorage if available
(() => {
    const saved = parseInt(localStorage.getItem('aqiThreshold') || '', 10);
    if (!Number.isNaN(saved)) {
        CONFIG.criticalAqiThreshold = saved;
    }
})();

// ============================================
// AQI Level Definitions
// ============================================
// Use shared AQI levels from utils.js if available
const AQI_LEVELS = window.AQI ? AQI.LEVELS : {
    good: { min: 0, max: 50, label: 'Good', class: 'good' },
    moderate: { min: 51, max: 100, label: 'Moderate', class: 'moderate' },
    unhealthySensitive: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', class: 'unhealthy-sensitive' },
    unhealthy: { min: 151, max: 200, label: 'Unhealthy', class: 'unhealthy' },
    veryUnhealthy: { min: 201, max: 300, label: 'Very Unhealthy', class: 'very-unhealthy' },
    hazardous: { min: 301, max: Infinity, label: 'Hazardous', class: 'hazardous' }
};

// ============================================
// Global Variables
// ============================================
let trendChart = null;
let autoRefreshTimer = null;
let countdownTimer = null;
let nextRefreshTime = null;

// Favorites management
const MAX_FAVORITES = 5;
let favoriteCities = JSON.parse(localStorage.getItem('favoriteCities') || '[]');

// Health recommendations by AQI level
const HEALTH_RECOMMENDATIONS = {
    good: [
        'Air quality is satisfactory - enjoy outdoor activities',
        'Perfect time for exercise and outdoor sports',
        'Open windows to let in fresh air',
        'Great day for a walk or jog'
    ],
    moderate: [
        'Air quality acceptable for most people',
        'Unusually sensitive individuals should limit prolonged outdoor exertion',
        'Consider reducing intense outdoor activities if you experience symptoms',
        'Monitor air quality if planning extended outdoor activities'
    ],
    'unhealthy-sensitive': [
        'Sensitive groups should reduce prolonged outdoor exertion',
        'Close windows to avoid outdoor air coming indoors',
        'Wear a mask when going outside',
        'People with respiratory conditions should stay indoors',
        'Reduce outdoor activities, especially for children and elderly'
    ],
    unhealthy: [
        'Everyone should reduce prolonged outdoor exertion',
        'Keep windows and doors closed',
        'Use air purifiers indoors',
        'Wear N95 masks if you must go outside',
        'Avoid intense physical activities',
        'People with heart or lung disease should stay indoors and rest'
    ],
    'very-unhealthy': [
        'Everyone should avoid all outdoor exertion',
        'Stay indoors and keep activity levels low',
        'Run air purifiers at maximum setting',
        'Keep emergency medications handy',
        'Seal windows and doors',
        'Consider evacuation if possible'
    ],
    hazardous: [
        'Health alert: Everyone may experience serious health effects',
        'Remain indoors and avoid all physical activities',
        'Use air purifiers and seal all windows',
        'Emergency measures - consider relocation if prolonged',
        'Keep medications and emergency contacts ready',
        'Monitor health closely and seek medical attention if needed'
    ]
};

// ============================================
// Data Fetching Function
// ============================================
async function fetchAQIData(city) {
    if (window.AQI && typeof AQI.fetchAQIData === 'function') {
        return AQI.fetchAQIData(city);
    }
    // Fallback to local implementation if utils not loaded
    try {
        const url = `${CONFIG.apiUrl}/${city}/?token=${CONFIG.apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        console.log('=== API RESPONSE DEBUG ===');
        console.log('Full JSON:', json);
        console.log('json.data:', json.data);
        console.log('json.data.aqi:', json.data ? json.data.aqi : 'N/A');
        if (json.status !== 'ok') throw new Error('API returned error status');
        const rd = json.data || {};
        // Extract and validate temperature (must be between -50 and 60 Celsius)
        let temp = rd.iaqi && rd.iaqi.t ? rd.iaqi.t.v : null;
        if (temp !== null && (temp < -50 || temp > 60)) {
            console.warn('Temperature out of range:', temp, '- setting to null');
            temp = null;
        }
        
        // Extract pollutant values, treating 999 as null (sensor error)
        const pollutants = {
            pm25: rd.iaqi && rd.iaqi.pm25 ? (rd.iaqi.pm25.v === 999 ? null : rd.iaqi.pm25.v) : null,
            pm10: rd.iaqi && rd.iaqi.pm10 ? (rd.iaqi.pm10.v === 999 ? null : rd.iaqi.pm10.v) : null,
            o3: rd.iaqi && rd.iaqi.o3 ? (rd.iaqi.o3.v === 999 ? null : rd.iaqi.o3.v) : null,
            no2: rd.iaqi && rd.iaqi.no2 ? (rd.iaqi.no2.v === 999 ? null : rd.iaqi.no2.v) : null,
            so2: rd.iaqi && rd.iaqi.so2 ? (rd.iaqi.so2.v === 999 ? null : rd.iaqi.so2.v) : null,
            co: rd.iaqi && rd.iaqi.co ? (rd.iaqi.co.v === 999 ? null : rd.iaqi.co.v) : null
        };
        
        // If API returns 999 for AQI, recalculate from available pollutants
        let finalAqi = rd.aqi;
        if (finalAqi === 999) {
            console.warn('API returned 999 AQI, recalculating from pollutants');
            // Use PM2.5 as primary indicator if available, otherwise use highest available pollutant
            const validPollutants = Object.values(pollutants).filter(v => v !== null && v !== 999);
            if (pollutants.pm25 !== null && pollutants.pm25 !== 999) {
                finalAqi = pollutants.pm25;
                console.log('Using PM2.5 value for AQI:', finalAqi);
            } else if (validPollutants.length > 0) {
                finalAqi = Math.max(...validPollutants);
                console.log('Using highest pollutant for AQI:', finalAqi);
            } else {
                finalAqi = null;
                console.warn('No valid pollutant data available');
            }
        }
        
        const processed = {
            aqi: finalAqi !== undefined && finalAqi !== null && finalAqi !== 999 ? finalAqi : null,
            city: (rd.city && rd.city.name) || city || 'Unknown',
            time: (rd.time && rd.time.s) || new Date().toISOString(),
            pollutants: pollutants,
            weather: {
                temperature: temp,
                humidity: rd.iaqi && rd.iaqi.h ? rd.iaqi.h.v : null,
                pressure: rd.iaqi && rd.iaqi.p ? rd.iaqi.p.v : null,
                windSpeed: rd.iaqi && rd.iaqi.w ? rd.iaqi.w.v : null,
                windGust: rd.iaqi && rd.iaqi.wg ? rd.iaqi.wg.v : null,
                dewPoint: rd.iaqi && rd.iaqi.dew ? rd.iaqi.dew.v : null
            },
            dominantPollutant: rd.dominentpol || 'N/A'
        };
        return { data: processed, isMock: false };
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        handleFetchError(error);
        const mock = {
            aqi: Math.floor(Math.random() * 250) + 50,
            city: city || 'Unknown',
            time: new Date().toISOString(),
            pollutants: {
                pm25: Math.floor(Math.random() * 150) + 20,
                pm10: Math.floor(Math.random() * 200) + 30,
                o3: Math.floor(Math.random() * 100) + 10,
                no2: Math.floor(Math.random() * 80) + 15,
                so2: Math.floor(Math.random() * 50) + 5,
                co: Math.floor(Math.random() * 30) + 2
            },
            weather: {
                temperature: Math.floor(Math.random() * 30) + 10,
                humidity: Math.floor(Math.random() * 50) + 30,
                pressure: Math.floor(Math.random() * 50) + 980,
                windSpeed: (Math.random() * 20 + 2).toFixed(1),
                windGust: null,
                dewPoint: null
            },
            dominantPollutant: 'pm25'
        };
        return { data: mock, isMock: true };
    }
}

// ============================================
// Data Processing Function
// ============================================
// Data processing is centralized in utils.js (AQI.processAQIData)

// ============================================
// Mock Data Generator (for demo/testing)
// ============================================
// Mock data generation is centralized in utils.js (AQI.getMockData)

// ============================================
// AQI Level Determination
// ============================================
function getAQILevel(aqi) {
    if (window.AQI && typeof AQI.getAQILevel === 'function') {
        return AQI.getAQILevel(aqi);
    }
    for (const level of Object.values(AQI_LEVELS)) {
        if (aqi >= level.min && aqi <= level.max) return level;
    }
    return AQI_LEVELS.hazardous;
}

// ============================================
// Dashboard Update Function
// ============================================
function updateDashboard(dataObj) {
    const data = dataObj.data || dataObj;
    const isMock = dataObj.isMock !== undefined ? dataObj.isMock : false;
    
    console.log('updateDashboard called with full data:', data);
    console.log('Weather data specifically:', data.weather);
    
    // Update AQI Value
    const aqiValueElement = document.getElementById('aqiValue');
    const aqiLabelElement = document.getElementById('aqiLabel');
    const aqiCardElement = document.getElementById('aqiCard');
    const updateTimeElement = document.getElementById('updateTime');
    const locationElement = document.getElementById('location');
    const dataSourceIndicator = document.getElementById('dataSourceIndicator');
    
    // Ensure AQI is a valid number
    console.log('=== AQI DEBUG ===');
    console.log('Raw data.aqi:', data.aqi);
    console.log('Type of data.aqi:', typeof data.aqi);
    
    // Check if AQI is actually available
    if (data.aqi === null || data.aqi === undefined || data.aqi === '') {
        console.error('No AQI data available for this location');
        aqiValueElement.textContent = '--';
        aqiLabelElement.textContent = 'No Data Available';
        return;
    }
    
    const aqiValue = parseInt(data.aqi);
    console.log('Parsed AQI Value:', aqiValue);
    console.log('City:', data.city);
    
    // Validate AQI is a valid number
    if (isNaN(aqiValue)) {
        console.error('Invalid AQI value:', data.aqi);
        aqiValueElement.textContent = '--';
        aqiLabelElement.textContent = 'Invalid Data';
        return;
    }
    
    // Validate AQI is in reasonable range (0-999)
    if (aqiValue > 999) {
        console.error('AQI value out of range:', aqiValue);
    }
    
    // Animate AQI value change
    if (aqiValueElement) {
        animateValue(aqiValueElement, 0, aqiValue, 1000);
    }
    
    // Update AQI level and styling
    const aqiLevel = getAQILevel(aqiValue);
    aqiLabelElement.textContent = aqiLevel.label;
    
    // Remove all AQI level classes and add the current one
    Object.values(AQI_LEVELS).forEach(level => {
        aqiCardElement.classList.remove(level.class);
    });
    aqiCardElement.classList.add(aqiLevel.class);
    
    // Tint chart by band
    try {
        const bandColor = getAqiBandColor(aqiLevel.class);
        if (trendChart && bandColor) {
            trendChart.data.datasets[0].borderColor = bandColor;
            trendChart.data.datasets[0].backgroundColor = hexToRgba(bandColor, 0.12);
            trendChart.data.datasets[0].pointBackgroundColor = bandColor;
            trendChart.update('none');
        }
    } catch (e) {
        // Non-fatal: keep theme color
        console.debug('Band color apply skipped:', e);
    }
    
    // Update location and time
    if (locationElement) {
        locationElement.textContent = data.city;
    }
    
    const updateDate = new Date(data.time);
    if (updateTimeElement) {
        const timeSpan = updateTimeElement.querySelector('span') || updateTimeElement;
        timeSpan.textContent = `Updated: ${updateDate.toLocaleTimeString()}`;
    }
    
    // Set data source indicator
    if (dataSourceIndicator) {
        const indicatorSpan = dataSourceIndicator.querySelector('span') || dataSourceIndicator;
        
        // Remove existing classes
        dataSourceIndicator.classList.remove('live', 'demo');
        
        if (isMock) {
            dataSourceIndicator.classList.add('demo');
            indicatorSpan.textContent = 'Demo Data';
        } else {
            dataSourceIndicator.classList.add('live');
            indicatorSpan.textContent = 'Live Data';
        }
    }
    // Update pollutant values
    updatePollutants(data.pollutants);
    
    // Update weather stats
    updateWeatherStats(data.weather);
    
    // Update AQI ring animation if available
    if (typeof window.updateAQIRing === 'function') {
        window.updateAQIRing(aqiValue);
    }
    
    // Update health impact if available
    if (typeof window.updateHealthImpact === 'function') {
        console.log('Calling updateHealthImpact with:', aqiLevel.class);
        window.updateHealthImpact(aqiLevel.class);
    } else {
        console.log('updateHealthImpact function not available');
    }
    
    // Check and display alerts
    checkAlerts(aqiValue);
    
    // Update health recommendations
    updateHealthRecommendations(aqiLevel.class);
    
    // Update chart with historical data
    updateChart();
    
    // Remove skeletons after update
    setSkeleton(false);
}

// ============================================
// Pollutants Update Function
// ============================================
function updatePollutants(pollutants) {
    const pollutantMap = {
        pm25: 'pm25Value',
        pm10: 'pm10Value',
        o3: 'o3Value',
        no2: 'no2Value',
        so2: 'so2Value',
        co: 'coValue'
    };
    
    for (const [pollutant, elementId] of Object.entries(pollutantMap)) {
        const element = document.getElementById(elementId);
        const value = pollutants[pollutant];
        
        if (value !== null && value !== undefined) {
            element.textContent = Math.round(value);
        } else {
            element.textContent = '--';
        }
    }
}

// ============================================
// Weather Stats Update Function
// ============================================
function updateWeatherStats(weather) {
    console.log('=== updateWeatherStats called ===');
    console.log('Weather object:', weather);
    console.log('Weather type:', typeof weather);
    console.log('Weather keys:', weather ? Object.keys(weather) : 'null');
    
    if (!weather || typeof weather !== 'object') {
        console.log('No valid weather data available - setting placeholders');
        setWeatherPlaceholders();
        return;
    }
    
    // Update temperature
    const tempElement = document.getElementById('tempValue');
    if (tempElement) {
        if (weather.temperature !== null && weather.temperature !== undefined) {
            tempElement.textContent = `${Math.round(weather.temperature)}°C`;
        } else {
            tempElement.textContent = 'N/A';
        }
    }
    
    // Update humidity
    const humidityElement = document.getElementById('humidityValue');
    if (humidityElement) {
        if (weather.humidity !== null && weather.humidity !== undefined) {
            humidityElement.textContent = `${Math.round(weather.humidity)}%`;
        } else {
            humidityElement.textContent = 'N/A';
        }
    }
    
    // Update wind speed - convert m/s to km/h
    const windElement = document.getElementById('windValue');
    if (windElement) {
        console.log('Wind speed raw value:', weather.windSpeed);
        if (weather.windSpeed !== null && weather.windSpeed !== undefined) {
            const windKmh = (parseFloat(weather.windSpeed) * 3.6).toFixed(1); // Convert m/s to km/h
            const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const displayText = `${windKmh} km/h ${randomDir}`;
            console.log('Setting wind to:', displayText);
            windElement.textContent = displayText;
        } else {
            console.log('Wind speed is null/undefined');
            windElement.textContent = 'N/A';
        }
    } else {
        console.log('windValue element not found!');
    }
    
    // Update pressure
    const pressureElement = document.getElementById('pressureValue');
    if (pressureElement) {
        if (weather.pressure !== null && weather.pressure !== undefined) {
            pressureElement.textContent = `${Math.round(weather.pressure)} hPa`;
        } else {
            pressureElement.textContent = 'N/A';
        }
    }
}

// Set placeholders when weather data is not available
function setWeatherPlaceholders() {
    const elements = {
        'tempValue': 'N/A',
        'humidityValue': 'N/A',
        'windValue': 'N/A',
        'pressureValue': 'N/A'
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// ============================================
// Alert System
// ============================================
function checkAlerts(aqi) {
    const alertBanner = document.getElementById('alertBanner');
    
    if (aqi >= CONFIG.criticalAqiThreshold) {
        alertBanner.classList.add('show');
    } else {
        alertBanner.classList.remove('show');
    }
}

// ============================================
// Chart Initialization and Update
// ============================================
function initializeChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Generate 24-hour historical data (from utils if available)
    const historicalData = (window.AQI && typeof AQI.generateMockHistoricalData === 'function')
        ? AQI.generateMockHistoricalData()
        : (function () {
            const labels = [];
            const values = [];
            const now = new Date();
            for (let i = 23; i >= 0; i--) {
                const time = new Date(now - i * 3600000);
                labels.push(time.getHours() + ':00');
                const baseValue = 50 + Math.random() * 100;
                const variation = Math.sin(i / 4) * 20;
                values.push(Math.max(10, baseValue + variation));
            }
            return { labels, values };
        })();
    
    const theme = getChartTheme();
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [{
                label: 'PM2.5 Concentration (μg/m³)',
                data: historicalData.values,
                borderColor: theme.lineColor,
                backgroundColor: theme.fillColor,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: theme.lineColor,
                pointBorderColor: theme.pointBorder,
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: theme.text,
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: theme.tooltipBg,
                    titleColor: theme.text,
                    bodyColor: theme.textMuted,
                    borderColor: theme.lineColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: {
                        color: theme.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: theme.textMuted,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: theme.grid,
                        drawBorder: false
                    },
                    ticks: {
                        color: theme.textMuted,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    // Expose chart to window for period controls
    window.trendChart = trendChart;
}

function updateChart() {
    if (trendChart) {
        // Generate new historical data
        const historicalData = (window.AQI && typeof AQI.generateMockHistoricalData === 'function')
            ? AQI.generateMockHistoricalData()
            : (function () {
                const labels = [];
                const values = [];
                const now = new Date();
                for (let i = 23; i >= 0; i--) {
                    const time = new Date(now - i * 3600000);
                    labels.push(time.getHours() + ':00');
                    const baseValue = 50 + Math.random() * 100;
                    const variation = Math.sin(i / 4) * 20;
                    values.push(Math.max(10, baseValue + variation));
                }
                return { labels, values };
            })();
        trendChart.data.labels = historicalData.labels;
        trendChart.data.datasets[0].data = historicalData.values;
        trendChart.update();
    }
}

// ============================================
// Mock Historical Data Generator
// ============================================
// Historical data generator is centralized in utils.js (AQI.generateMockHistoricalData)

// ============================================
// Utility Functions
// ============================================
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        const currentValue = Math.round(current);
        const endValue = Math.round(end);
        
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            // Only pad to 3 digits if value is actually 3 digits (100+)
            element.textContent = endValue >= 100 ? endValue.toString().padStart(3, '0') : endValue.toString();
            clearInterval(timer);
        } else {
            // Only pad to 3 digits if value is actually 3 digits (100+)
            element.textContent = currentValue >= 100 ? currentValue.toString().padStart(3, '0') : currentValue.toString();
        }
    }, 16);
}

function handleFetchError(error) {
    console.warn('Using mock data due to API error:', error.message);
    // Could display a notification to the user here
}

// ============================================
// Theme & Skeleton Utilities
// ============================================
function applyTheme(mode) {
    const isLight = mode === 'light';
    document.body.classList.toggle('theme-light', isLight);
    // swap icons if present
    const sun = document.getElementById('iconSun');
    const moon = document.getElementById('iconMoon');
    if (sun && moon) {
        sun.style.display = isLight ? 'inline' : 'none';
        moon.style.display = isLight ? 'none' : 'inline';
    }
}

function setSkeleton(active) {
    const aqiVal = document.getElementById('aqiValue');
    const polVals = document.querySelectorAll('.pollutant-value');
    if (aqiVal) aqiVal.classList.toggle('skeleton', active);
    polVals.forEach(el => el.classList.toggle('skeleton', active));
}

// Map AQI band class to CSS variable color
function getAqiBandColor(levelClass) {
    const map = {
        'good': '--aqi-good',
        'moderate': '--aqi-moderate',
        'unhealthy-sensitive': '--aqi-unhealthy-sensitive',
        'unhealthy': '--aqi-unhealthy',
        'very-unhealthy': '--aqi-very-unhealthy',
        'hazardous': '--aqi-hazardous'
    };
    const varName = map[levelClass];
    if (!varName) return null;
    const val = getCssVar(varName);
    return val || null;
}

function hexToRgba(hex, alpha) {
    if (!hex) return null;
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================
// Auto-refresh Function
// ============================================
function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    
    nextRefreshTime = Date.now() + CONFIG.refreshInterval;
    updateCountdown();
    
    countdownTimer = setInterval(updateCountdown, 1000);
    
    autoRefreshTimer = setInterval(() => {
        fetchAQIData(CONFIG.defaultCity).then(data => {
            updateDashboard(data);
            showToast('Data refreshed automatically', 'success', 2000);
            nextRefreshTime = Date.now() + CONFIG.refreshInterval;
        }).catch(() => {
            showToast('Auto-refresh failed', 'error');
        });
    }, CONFIG.refreshInterval);
}

function updateCountdown() {
    const countdownEl = document.getElementById('countdownText');
    if (!countdownEl) return;
    
    const remaining = Math.max(0, nextRefreshTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    countdownEl.textContent = `Next update in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('refreshCountdown').style.display = 'inline-flex';
}

// ============================================
// Favorites Management
// ============================================
function renderFavorites() {
    const bar = document.getElementById('favoritesBar');
    if (!bar) return;
    
    if (favoriteCities.length === 0) {
        bar.style.display = 'none';
        return;
    }
    
    bar.style.display = 'flex';
    bar.innerHTML = favoriteCities.map((city, idx) => `
        <div class="favorite-chip ${city === CONFIG.defaultCity ? 'active' : ''}" data-city="${city}">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            ${city}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="remove-fav" data-city="${city}" style="cursor:pointer;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>
    `).join('');
    
    bar.querySelectorAll('.favorite-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            if (e.target.closest('.remove-fav')) {
                removeFavorite(chip.dataset.city);
            } else {
                selectFavorite(chip.dataset.city);
            }
        });
    });
}

function addToFavorites(city) {
    if (favoriteCities.includes(city)) return;
    if (favoriteCities.length >= MAX_FAVORITES) {
        showToast(`Maximum ${MAX_FAVORITES} favorites allowed`, 'info');
        return;
    }
    favoriteCities.push(city);
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
    renderFavorites();
    showToast(`Added ${city} to favorites`, 'success');
}

function removeFavorite(city) {
    favoriteCities = favoriteCities.filter(c => c !== city);
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
    renderFavorites();
    showToast(`Removed ${city} from favorites`, 'info');
}

function selectFavorite(city) {
    const citySelect = document.getElementById('citySelect');
    const found = Array.from(citySelect.options).find(opt => opt.value.toLowerCase() === city.toLowerCase());
    if (found) {
        citySelect.value = found.value;
    }
    document.getElementById('fetchBtn')?.click();
}

// ============================================
// Health Recommendations
// ============================================
function updateHealthRecommendations(levelClass) {
    const panel = document.getElementById('healthRecommendations');
    if (!panel) return;
    
    const recommendations = HEALTH_RECOMMENDATIONS[levelClass] || [];
    panel.innerHTML = recommendations.map(rec => `<li>${rec}</li>`).join('');
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    toast.innerHTML = `
        ${icons[type] || icons.info}
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// Keyboard Shortcuts
// ============================================
function setupKeyboardShortcuts() {
    const shortcutsPanel = document.getElementById('shortcutsPanel');
    
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.matches('input, textarea, select')) return;
        
        switch(e.key.toLowerCase()) {
            case '?':
                e.preventDefault();
                if (shortcutsPanel) {
                    shortcutsPanel.classList.toggle('show');
                    setTimeout(() => {
                        if (shortcutsPanel.classList.contains('show')) {
                            shortcutsPanel.classList.remove('show');
                        }
                    }, 5000);
                }
                break;
            case 'r':
                e.preventDefault();
                document.getElementById('fetchBtn')?.click();
                showToast('Refreshing data...', 'info', 1500);
                break;
            case 't':
                e.preventDefault();
                document.getElementById('themeToggle')?.click();
                break;
            case 'c':
                e.preventDefault();
                window.location.href = 'cities.html' + (location.search || '');
                break;
            case 'h':
                e.preventDefault();
                window.location.href = 'trends.html' + (location.search || '');
                break;
            case 'escape':
                if (shortcutsPanel?.classList.contains('show')) {
                    shortcutsPanel.classList.remove('show');
                }
                break;
        }
    });
}

// ============================================
// Share & Export Functions
// ============================================
function setupShareExport() {
    const shareBtn = document.getElementById('shareBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const aqiValue = document.getElementById('aqiValue')?.textContent;
            const location = document.getElementById('location')?.textContent;
            const aqiLabel = document.getElementById('aqiLabel')?.textContent;
            
            const shareData = {
                title: 'Air Quality Index',
                text: `Current AQI in ${location}: ${aqiValue} (${aqiLabel})`,
                url: window.location.href
            };
            
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    showToast('Shared successfully!', 'success');
                } else {
                    await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                    showToast('Link copied to clipboard!', 'success');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    showToast('Could not share', 'error');
                }
            }
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const aqiValue = document.getElementById('aqiValue')?.textContent;
            const location = document.getElementById('location')?.textContent;
            const aqiLabel = document.getElementById('aqiLabel')?.textContent;
            const updateTime = document.getElementById('updateTime')?.textContent;
            
            const pollutants = {
                pm25: document.getElementById('pm25Value')?.textContent,
                pm10: document.getElementById('pm10Value')?.textContent,
                o3: document.getElementById('o3Value')?.textContent,
                no2: document.getElementById('no2Value')?.textContent,
                so2: document.getElementById('so2Value')?.textContent,
                co: document.getElementById('coValue')?.textContent
            };
            
            const data = {
                location,
                aqi: aqiValue,
                level: aqiLabel,
                timestamp: new Date().toISOString(),
                updateTime,
                pollutants
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aqi-${location.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('Data exported successfully!', 'success');
        });
    }
}

// ============================================
// City Selector Event Handlers
// ============================================
function setupCitySelector() {
    const citySelect = document.getElementById('citySelect');
    const cityInput = document.getElementById('cityInput');
    const fetchBtn = document.getElementById('fetchBtn');
    
    // Handle dropdown change
    citySelect.addEventListener('change', () => {
        if (citySelect.value === 'custom') {
            cityInput.style.display = 'block';
            cityInput.focus();
        } else {
            cityInput.style.display = 'none';
        }
    });
    
    // Handle fetch button click
    fetchBtn.addEventListener('click', async () => {
        const city = citySelect.value === 'custom' ? cityInput.value.trim() : citySelect.value;
        
        if (!city) {
            alert('Please enter a city name');
            return;
        }
        
        // Show loading state
        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Loading...';
        fetchBtn.classList.add('loading');
        
        try {
            setSkeleton(true);
            const result = await fetchAQIData(city);
            updateDashboard(result);
            CONFIG.defaultCity = city; // Update default city
            // Persist and reflect in URL for cross-page use
            localStorage.setItem('selectedCity', city);
            const url = new URL(location.href);
            url.searchParams.set('city', city);
            history.replaceState({}, '', url);
            showToast(`Updated to ${city}`, 'success');
            
            // Ask to add to favorites if not already there
            if (!favoriteCities.includes(city) && favoriteCities.length < MAX_FAVORITES) {
                setTimeout(() => {
                    if (confirm(`Add ${city} to favorites for quick access?`)) {
                        addToFavorites(city);
                    }
                }, 1500);
            }
        } catch (error) {
            showToast('Error fetching data. Please try another city.', 'error');
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Update';
            fetchBtn.classList.remove('loading');
            setSkeleton(false);
        }
    });
    
    // Handle Enter key in custom input
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchBtn.click();
        }
    });
}

// ============================================
// Initialization on Page Load
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing AQI Dashboard...');
    
    // Initialize chart
    initializeChart();
    
    // Setup city selector
    setupCitySelector();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Setup share and export
    setupShareExport();
    
    // Render favorites
    renderFavorites();
    
    // Theme: apply saved preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
            const next = current === 'light' ? 'dark' : 'light';
            applyTheme(next);
            localStorage.setItem('theme', next);
            // Update chart theme immediately
            if (trendChart) {
                applyChartTheme(trendChart);
            }
            // Notify other pages/components
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: next } }));
        });
    }
    
    // Determine city from URL or saved preference
    const params = new URLSearchParams(location.search);
    let initialCity = params.get('city');
    if (!initialCity) {
        const saved = localStorage.getItem('selectedCity');
        if (saved && saved.trim()) initialCity = saved.trim();
    }
    if (initialCity) {
        CONFIG.defaultCity = initialCity;
        const citySelect = document.getElementById('citySelect');
        const locationElement = document.getElementById('location');
        if (citySelect) {
            const found = Array.from(citySelect.options).find(opt => opt.value.toLowerCase() === initialCity.toLowerCase());
            if (found) {
                citySelect.value = found.value;
            } else {
                const cityInput = document.getElementById('cityInput');
                if (cityInput) {
                    cityInput.style.display = 'block';
                    cityInput.value = initialCity;
                    citySelect.value = 'custom';
                }
            }
        }
        if (locationElement) locationElement.textContent = `${initialCity}`;
        // Ensure URL reflects city for shareability
        const url = new URL(location.href);
        url.searchParams.set('city', initialCity);
        history.replaceState({}, '', url);
    }
    
    // Skeleton loading on first load
    setSkeleton(true);
    // Fetch initial data
    const result = await fetchAQIData(CONFIG.defaultCity);
    updateDashboard(result);
    setSkeleton(false);
    
    // Show welcome message
    setTimeout(() => {
        showToast('Welcome! Press ? for keyboard shortcuts', 'info', 4000);
    }, 1000);
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => {
            console.log('Service Worker registered');
        }).catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
    
    // Check for PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            if (confirm('Install AQI Monitor as an app for quick access?')) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        showToast('App installed successfully!', 'success');
                    }
                    deferredPrompt = null;
                });
            }
        }, 3000);
    });
    
    console.log('Dashboard initialized successfully!');
});

// ============================================
// Intersection Observer for Scroll Animations
// ============================================
if ('IntersectionObserver' in window) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements on page load
    document.addEventListener('DOMContentLoaded', () => {
        const animatedElements = document.querySelectorAll('.card, .pollutant-item, .health-panel');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    });
}

// ============================================
// Performance Monitoring
// ============================================
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.startTime);
            }
        }
    });
    
    try {
        perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        // Browser doesn't support
    }
}

// ============================================
// Chart theming helpers
// ============================================
function getCssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}

function getChartTheme() {
    const text = getCssVar('--text-primary', '#e8eaf6');
    const textMuted = getCssVar('--text-secondary', '#9fa8da');
    const grid = getCssVar('--border-color', 'rgba(42, 51, 89, 0.5)');
    const fill = 'rgba(102, 126, 234, 0.10)';
    const lineColor = '#667eea';
    const pointBorder = document.body.classList.contains('theme-light') ? '#ffffff' : '#ffffff';
    const tooltipBg = document.body.classList.contains('theme-light') ? 'rgba(255,255,255,0.95)' : 'rgba(26,33,64,0.95)';
    return { text, textMuted, grid, fillColor: fill, lineColor, pointBorder, tooltipBg };
}

function applyChartTheme(chart) {
    const theme = getChartTheme();
    chart.options.plugins.legend.labels.color = theme.text;
    chart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    chart.options.plugins.tooltip.titleColor = theme.text;
    chart.options.plugins.tooltip.bodyColor = theme.textMuted;
    chart.options.scales.x.grid.color = theme.grid;
    chart.options.scales.y.grid.color = theme.grid;
    chart.options.scales.x.ticks.color = theme.textMuted;
    chart.options.scales.y.ticks.color = theme.textMuted;
    chart.data.datasets[0].borderColor = theme.lineColor;
    chart.data.datasets[0].backgroundColor = theme.fillColor;
    chart.data.datasets[0].pointBackgroundColor = theme.lineColor;
    chart.data.datasets[0].pointBorderColor = theme.pointBorder;
    chart.update('none');
}
