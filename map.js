// Interactive AQI Map functionality
class AQIMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentLayer = 'aqi';
        this.cityData = {};
        this.isLoading = false;

        // Major cities with coordinates (sample data)
        this.cities = [
            { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
            { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
            { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
            { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
            { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
            { name: 'Pune', lat: 18.5204, lng: 73.8567 },
            { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
            { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
            { name: 'Surat', lat: 21.1702, lng: 72.8311 },
            { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
            { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
            { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
            { name: 'Indore', lat: 22.7196, lng: 75.8577 },
            { name: 'Thane', lat: 19.2183, lng: 72.9781 },
            { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
            { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
            { name: 'Pimpri-Chinchwad', lat: 18.6279, lng: 73.8007 },
            { name: 'Patna', lat: 25.5941, lng: 85.1376 },
            { name: 'Vadodara', lat: 22.3072, lng: 73.1812 }
        ];

        this.init();
    }

    async init() {
        this.showLoading(true);
        await this.initializeMap();
        await this.loadCityData();
        this.setupEventListeners();
        this.showLoading(false);
    }

    async initializeMap() {
        // Initialize Leaflet map centered on India
        this.map = L.map('map', {
            center: [20.5937, 78.9629], // Center of India
            zoom: 5,
            minZoom: 4,
            maxZoom: 12,
            zoomControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add dark mode support
        this.updateMapTheme();
    }

    async loadCityData() {
        this.isLoading = true;
        const promises = this.cities.map(async (city) => {
            try {
                const result = await AQI.fetchAQIData(city.name);
                this.cityData[city.name] = {
                    ...city,
                    ...result.data,
                    isMock: result.isMock,
                    isCached: result.isCached
                };
            } catch (error) {
                console.warn(`Failed to load data for ${city.name}:`, error);
                // Use mock data as fallback
                this.cityData[city.name] = {
                    ...city,
                    ...AQI.getMockData(city.name),
                    isMock: true
                };
            }
        });

        await Promise.allSettled(promises);
        this.updateMarkers();
        this.isLoading = false;
    }

    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        Object.values(this.cityData).forEach(city => {
            const marker = this.createMarker(city);
            if (marker) {
                this.markers.push(marker);
                marker.addTo(this.map);
            }
        });
    }

    createMarker(city) {
        const aqiLevel = AQI.getAQILevel(city.aqi);
        const size = this.getMarkerSize(city.aqi);
        const color = this.getMarkerColor(aqiLevel.class);

        // Create custom marker icon
        const icon = L.divIcon({
            className: 'aqi-marker',
            html: `
                <div class="marker-content" style="
                    background: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${Math.max(10, size * 0.4)}px;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    cursor: pointer;
                ">
                    ${city.aqi}
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });

        const marker = L.marker([city.lat, city.lng], { icon });

        // Add popup
        const popupContent = this.createPopupContent(city);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'aqi-popup'
        });

        return marker;
    }

    createPopupContent(city) {
        const aqiLevel = AQI.getAQILevel(city.aqi);
        const dataSource = city.isMock ? 'Demo Data' : (city.isCached ? 'Cached Data' : 'Live Data');

        return `
            <div class="popup-content">
                <h3>${city.city}</h3>
                <div class="popup-aqi" style="color: var(--aqi-${aqiLevel.class.replace('unhealthy-sensitive', 'unhealthy-sensitive').replace('very-unhealthy', 'very-unhealthy').replace('unhealthy', 'unhealthy')});">
                    <strong>AQI: ${city.aqi}</strong>
                    <span>(${aqiLevel.label})</span>
                </div>
                <div class="popup-pollutants">
                    <div>PM<sub>2.5</sub>: ${city.pollutants.pm25 || '--'} μg/m³</div>
                    <div>PM<sub>10</sub>: ${city.pollutants.pm10 || '--'} μg/m³</div>
                    <div>O₃: ${city.pollutants.o3 || '--'} μg/m³</div>
                    <div>NO₂: ${city.pollutants.no2 || '--'} μg/m³</div>
                </div>
                <div class="popup-meta">
                    <small>Updated: ${new Date(city.time).toLocaleString()}</small><br>
                    <small>Data: ${dataSource}</small>
                </div>
                <button class="popup-btn" onclick="window.location.href='index.html?city=${encodeURIComponent(city.city)}'">
                    View Details
                </button>
            </div>
        `;
    }

    getMarkerSize(aqi) {
        // Size based on AQI severity
        if (aqi <= 50) return 30;
        if (aqi <= 100) return 35;
        if (aqi <= 150) return 40;
        if (aqi <= 200) return 45;
        if (aqi <= 300) return 50;
        return 55;
    }

    getMarkerColor(levelClass) {
        const colors = {
            'good': '#00e400',
            'moderate': '#ffff00',
            'unhealthy-sensitive': '#ff7e00',
            'unhealthy': '#ff0000',
            'very-unhealthy': '#8f3f97',
            'hazardous': '#7e0023'
        };
        return colors[levelClass] || colors.hazardous;
    }

    setupEventListeners() {
        // Layer selector
        document.getElementById('mapLayerSelect').addEventListener('change', (e) => {
            this.currentLayer = e.target.value;
            this.updateMarkers();
        });

        // Locate user
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.locateUser();
        });

        // Refresh data
        document.getElementById('refreshMapBtn').addEventListener('click', async () => {
            this.showLoading(true);
            await this.loadCityData();
            this.showLoading(false);
            showToast('Map data refreshed', 'success');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.updateMapTheme();
        });

        // Listen for theme changes
        window.addEventListener('theme-changed', () => {
            this.updateMapTheme();
        });
    }

    async locateUser() {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by this browser', 'error');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });

            const { latitude, longitude } = position.coords;
            this.map.setView([latitude, longitude], 10);

            // Add user location marker
            L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.map).bindPopup('Your Location');

            showToast('Location found!', 'success');
        } catch (error) {
            console.error('Error getting location:', error);
            showToast('Unable to get your location', 'error');
        }
    }

    updateMapTheme() {
        const isDark = !document.body.classList.contains('theme-light');

        // Update map tiles for theme
        if (isDark) {
            // Dark theme tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap contributors © CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);
        } else {
            // Light theme tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const mapLoading = document.getElementById('mapLoading');

        if (show) {
            overlay.classList.add('active');
            mapLoading.style.display = 'flex';
        } else {
            overlay.classList.remove('active');
            mapLoading.style.display = 'none';
        }
    }
}

// Global toast function
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

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AQI Map...');

    // Theme setup
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('theme-light', savedTheme === 'light');

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
            const next = current === 'light' ? 'dark' : 'light';
            document.body.classList.toggle('theme-light', next === 'light');
            localStorage.setItem('theme', next);
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { mode: next } }));
        });
    }

    // Initialize map
    new AQIMap();

    console.log('AQI Map initialized successfully!');
});
