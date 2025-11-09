// ============================================
// Modern AQI Dashboard - Enhanced Features
// Live Search, Animations & Interactions
// ============================================

/**
 * Initialize modern features on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initScrollEffects();
    initLiveSearch();
    initLocationDetection();
    initCardAnimations();
    initAQIRing();
    initSmoothScroll();
    initChartControls();
});

/**
 * Sticky Navigation Scroll Effect
 */
function initScrollEffects() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add scrolled class for styling
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        // Hide nav on scroll down, show on scroll up (optional)
        if (currentScroll > lastScroll && currentScroll > 300) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
}

/**
 * Live Search Functionality
 */
function initLiveSearch() {
    const searchInput = document.getElementById('citySearch');
    const citySelect = document.getElementById('citySelect');
    
    if (!searchInput || !citySelect) return;
    
    // Create search results dropdown
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'search-results';
    resultsDiv.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        margin-top: 0.5rem;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
        display: none;
        z-index: 100;
    `;
    
    const searchWrapper = searchInput.closest('.search-wrapper');
    searchWrapper.style.position = 'relative';
    searchWrapper.parentElement.appendChild(resultsDiv);
    
    // Get all cities from select
    const cities = Array.from(citySelect.options)
        .filter(opt => opt.value && opt.value !== '' && opt.value !== 'custom')
        .map(opt => ({
            value: opt.value,
            text: opt.textContent,
            group: opt.parentElement.label || ''
        }));
    
    console.log(`Loaded ${cities.length} cities for live search`);
    
    // Show all cities function - show ALL cities, not just 50
    const showAllCities = () => {
        try {
            console.log('showAllCities called, total cities:', cities.length);
            
            // Clear results
            resultsDiv.innerHTML = '';
            
            // Create a document fragment for better performance
            const fragment = document.createDocumentFragment();
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = 'padding: 0.75rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); font-size: 0.813rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;';
            header.innerHTML = `<strong>${cities.length}</strong> Cities Available - Scroll to browse`;
            fragment.appendChild(header);
            
            let currentGroup = '';
            let cityCount = 0;
            
            // Show ALL cities, grouped by state
            cities.forEach((city, index) => {
                // Add group header if needed
                if (city.group !== currentGroup) {
                    currentGroup = city.group;
                    const groupDiv = document.createElement('div');
                    groupDiv.style.cssText = 'padding: 0.625rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); font-size: 0.75rem; color: var(--accent-primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;';
                    groupDiv.textContent = city.group || 'Other';
                    fragment.appendChild(groupDiv);
                }
                
                // Add city item
                const cityDiv = document.createElement('div');
                cityDiv.className = 'search-result-item';
                cityDiv.dataset.value = city.value;
                cityDiv.style.cssText = 'padding: 0.875rem 1.5rem; cursor: pointer; transition: all 0.2s ease; border-bottom: 1px solid var(--border-color);';
                cityDiv.textContent = city.text;
                fragment.appendChild(cityDiv);
                cityCount++;
            });
            
            // Append all at once
            resultsDiv.appendChild(fragment);
            resultsDiv.style.display = 'block';
            
            console.log(`Successfully rendered ${cityCount} cities`);
            attachResultListeners();
        } catch (error) {
            console.error('Error in showAllCities:', error);
            resultsDiv.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: red;">Error loading cities. Check console.</div>';
            resultsDiv.style.display = 'block';
        }
    };
    
    // Attach event listeners to result items
    const attachResultListeners = () => {
        resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(99, 102, 241, 0.1)';
            });
            item.addEventListener('mouseleave', function() {
                this.style.background = '';
            });
            item.addEventListener('click', function() {
                const value = this.dataset.value;
                citySelect.value = value;
                searchInput.value = '';
                resultsDiv.style.display = 'none';
                document.getElementById('fetchBtn')?.click();
            });
        });
    };
    
    // Dropdown toggle button
    const dropdownToggle = document.getElementById('dropdownToggle');
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (resultsDiv.style.display === 'block') {
                resultsDiv.style.display = 'none';
                dropdownToggle.classList.remove('active');
            } else {
                showAllCities();
                dropdownToggle.classList.add('active');
            }
        });
    }
    
    // Show dropdown on focus if empty
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length === 0) {
            showAllCities();
        }
    });
    
    // Search and filter
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length < 1) {
            showAllCities();
            return;
        }
        
        const filtered = cities.filter(city => 
            city.text.toLowerCase().includes(query) ||
            city.value.toLowerCase().includes(query) ||
            city.group.toLowerCase().includes(query)
        ).slice(0, 50); // Show more results
        
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No cities found for "<strong>' + query + '</strong>"</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        const safeQuery = String(query).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let html = `<div style="padding: 0.75rem 1.5rem; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color); font-size: 0.813rem; color: var(--text-muted);">
            Found <strong>${filtered.length}</strong> ${filtered.length === 50 ? '+' : ''} cities matching "<strong>${safeQuery}</strong>"
        </div>`;
        
        html += filtered.map(city => {
            const safeValue = String(city.value).replace(/"/g, '&quot;');
            const safeText = String(city.text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeGroup = String(city.group).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            return `
            <div class="search-result-item" data-value="${safeValue}" style="
                padding: 0.875rem 1.5rem;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">${safeText}</div>
                    <div style="font-size: 0.813rem; color: var(--text-muted); margin-top: 0.25rem;">${safeGroup}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        `;
        }).join('');
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
        attachResultListeners();
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });
    
    // Close on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resultsDiv.style.display = 'none';
            searchInput.blur();
        }
    });
}

/**
 * Location Detection with Geolocation API
 */
function initLocationDetection() {
    const locationBtn = document.getElementById('useLocation');
    if (!locationBtn) return;
    
    locationBtn.addEventListener('click', async () => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }
        
        // Show loading state
        locationBtn.innerHTML = '<div style="width: 18px; height: 18px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>';
        locationBtn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Fetch AQI for coordinates
                    const response = await fetch(
                        `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${CONFIG.apiKey}`
                    );
                    const data = await response.json();
                    
                    if (data.status === 'ok') {
                        const cityName = data.data.city.name;
                        
                        console.log('=== LOCATION API FULL RESPONSE ===');
                        console.log('Full data.data:', JSON.stringify(data.data, null, 2));
                        console.log('IAQI object:', data.data.iaqi);
                        console.log('Available IAQI keys:', data.data.iaqi ? Object.keys(data.data.iaqi) : 'none');
                        
                        // Directly update the dashboard with the location data
                        if (typeof updateDashboard === 'function') {
                            // Extract temperature - check all available fields
                            let temp = null;
                            if (data.data.iaqi) {
                                if (data.data.iaqi.t && data.data.iaqi.t.v) {
                                    temp = data.data.iaqi.t.v;
                                    console.log('Temperature from iaqi.t:', temp);
                                }
                            }
                            
                            // Validate temperature is reasonable (between -50 and 60 Celsius)
                            if (temp !== null && (temp < -50 || temp > 60)) {
                                console.warn('Temperature out of range:', temp, '- setting to null');
                                temp = null;
                            }
                            
                            console.log('Final temperature value:', temp);
                            
                            // Extract all weather fields - no estimates, keep original data only
                            let humidity = data.data.iaqi && data.data.iaqi.h ? data.data.iaqi.h.v : null;
                            let pressure = data.data.iaqi && data.data.iaqi.p ? data.data.iaqi.p.v : null;
                            let windSpeed = data.data.iaqi && data.data.iaqi.w ? data.data.iaqi.w.v : null;
                            let windGust = data.data.iaqi && data.data.iaqi.wg ? data.data.iaqi.wg.v : null;
                            let dewPoint = data.data.iaqi && data.data.iaqi.dew ? data.data.iaqi.dew.v : null;
                            
                            // Extract pollutants, treating 999 as null (sensor error)
                            const pollutants = {
                                pm25: data.data.iaqi && data.data.iaqi.pm25 ? (data.data.iaqi.pm25.v === 999 ? null : data.data.iaqi.pm25.v) : null,
                                pm10: data.data.iaqi && data.data.iaqi.pm10 ? (data.data.iaqi.pm10.v === 999 ? null : data.data.iaqi.pm10.v) : null,
                                o3: data.data.iaqi && data.data.iaqi.o3 ? (data.data.iaqi.o3.v === 999 ? null : data.data.iaqi.o3.v) : null,
                                no2: data.data.iaqi && data.data.iaqi.no2 ? (data.data.iaqi.no2.v === 999 ? null : data.data.iaqi.no2.v) : null,
                                so2: data.data.iaqi && data.data.iaqi.so2 ? (data.data.iaqi.so2.v === 999 ? null : data.data.iaqi.so2.v) : null,
                                co: data.data.iaqi && data.data.iaqi.co ? (data.data.iaqi.co.v === 999 ? null : data.data.iaqi.co.v) : null
                            };
                            
                            // If API returns 999 for AQI, recalculate from available pollutants
                            let finalAqi = data.data.aqi;
                            if (finalAqi === 999) {
                                console.warn('API returned 999 AQI, recalculating from pollutants');
                                const validPollutants = Object.values(pollutants).filter(v => v !== null);
                                if (pollutants.pm25 !== null) {
                                    finalAqi = pollutants.pm25;
                                } else if (validPollutants.length > 0) {
                                    finalAqi = Math.max(...validPollutants);
                                } else {
                                    finalAqi = null;
                                }
                            }
                            
                            const processedData = {
                                aqi: finalAqi !== undefined && finalAqi !== null && finalAqi !== 999 ? finalAqi : null,
                                city: cityName,
                                time: (data.data.time && data.data.time.s) || new Date().toISOString(),
                                pollutants: pollutants,
                                weather: {
                                    temperature: temp,
                                    humidity: humidity,
                                    pressure: pressure,
                                    windSpeed: windSpeed,
                                    windGust: windGust,
                                    dewPoint: dewPoint
                                },
                                dominantPollutant: data.data.dominentpol || 'N/A'
                            };
                            
                            console.log('Processed weather data (with estimates):', processedData.weather);
                            updateDashboard({ data: processedData, isMock: false });
                        }
                        
                        // Try to find in select for sync (optional)
                        const citySelect = document.getElementById('citySelect');
                        const option = Array.from(citySelect.options).find(opt => 
                            opt.value.toLowerCase().includes(cityName.toLowerCase()) ||
                            opt.textContent.toLowerCase().includes(cityName.toLowerCase())
                        );
                        
                        if (option) {
                            citySelect.value = option.value;
                        }
                        
                        // Always show success message with location name
                        showToast(`📍 Showing AQI for: ${cityName}`, 'success');
                    }
                } catch (error) {
                    showToast('Could not fetch location data', 'error');
                } finally {
                    resetLocationButton(locationBtn);
                }
            },
            (error) => {
                let message = 'Could not determine your location';
                if (error.code === 1) message = 'Location permission denied';
                if (error.code === 2) message = 'Location unavailable';
                if (error.code === 3) message = 'Location request timed out';
                
                showToast(message, 'error');
                resetLocationButton(locationBtn);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

function resetLocationButton(btn) {
    btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
        </svg>
    `;
    btn.disabled = false;
}

/**
 * Card Entrance Animations with Intersection Observer
 */
function initCardAnimations() {
    const cards = document.querySelectorAll('.animated-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
    });
}

/**
 * Animated AQI Ring Progress
 */
function initAQIRing() {
    const ring = document.getElementById('ringProgress');
    if (!ring) return;
    
    // This will be called when AQI updates
    window.updateAQIRing = (aqi, maxAQI = 500) => {
        const circumference = 2 * Math.PI * 90; // r = 90
        const progress = Math.min(aqi / maxAQI, 1);
        const offset = circumference - (progress * circumference);
        
        ring.style.strokeDashoffset = offset;
        
        // Update color based on AQI level
        if (aqi <= 50) ring.style.stroke = '#10b981';
        else if (aqi <= 100) ring.style.stroke = '#f59e0b';
        else if (aqi <= 150) ring.style.stroke = '#f97316';
        else if (aqi <= 200) ring.style.stroke = '#ef4444';
        else if (aqi <= 300) ring.style.stroke = '#a855f7';
        else ring.style.stroke = '#dc2626';
    };
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 2rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#6366f1'
    };
    
    toast.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${colors[type] || colors.info};
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        color: var(--text-primary);
        font-weight: 500;
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        animation: slideInRight 0.3s ease-out;
        transition: all 0.3s ease;
    `;
    
    toast.textContent = message;
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add slide in animation
if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Mobile Menu Toggle
 */
const mobileToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('mobile-open');
        mobileToggle.classList.toggle('active');
        
        // Animate hamburger
        const spans = mobileToggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translateY(8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
        } else {
            spans.forEach(span => {
                span.style.transform = '';
                span.style.opacity = '';
            });
        }
    });
}

/**
 * Add mobile menu styles dynamically
 */
if (!document.getElementById('mobile-menu-styles')) {
    const style = document.createElement('style');
    style.id = 'mobile-menu-styles';
    style.textContent = `
        @media (max-width: 768px) {
            .nav-menu {
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background: var(--bg-secondary);
                flex-direction: column;
                padding: 1rem;
                transform: translateY(-150%);
                transition: transform 0.3s ease;
                box-shadow: var(--shadow-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .nav-menu.mobile-open {
                transform: translateY(0);
            }
            
            .nav-link {
                width: 100%;
                text-align: center;
                padding: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Export function to update health impact message
 */
window.updateHealthImpact = (level) => {
    const healthImpact = document.getElementById('healthImpact');
    if (!healthImpact) {
        console.log('healthImpact element not found');
        return;
    }
    
    console.log('updateHealthImpact called with level:', level);
    
    const impacts = {
        good: {
            icon: '✅',
            message: 'Perfect air quality - ideal for outdoor activities and exercise!'
        },
        moderate: {
            icon: '😊',
            message: 'Air quality is acceptable for most people. Unusually sensitive should consider limiting prolonged outdoor exertion.'
        },
        'unhealthy-sensitive': {
            icon: '😷',
            message: 'Sensitive groups (children, elderly, respiratory issues) should limit prolonged outdoor exposure.'
        },
        unhealthy: {
            icon: '⚠️',
            message: 'Everyone should reduce prolonged outdoor exertion. Keep windows closed and use air purifiers.'
        },
        'very-unhealthy': {
            icon: '🚨',
            message: 'Health warning! Avoid all outdoor physical activities. Stay indoors with air purifiers running.'
        },
        hazardous: {
            icon: '☠️',
            message: 'Emergency conditions! Everyone should remain indoors. Seal windows and avoid all outdoor activity.'
        }
    };
    
    const impact = impacts[level] || impacts.moderate;
    console.log('Using impact for level:', level, impact);
    
    healthImpact.innerHTML = `
        <span style="font-size: 1.5rem;">${impact.icon}</span>
        <span>${impact.message}</span>
    `;
};

/**
 * Enhanced Favorite Button
 */
document.addEventListener('click', (e) => {
    if (e.target.closest('#favoriteBtn')) {
        const citySelect = document.getElementById('citySelect');
        const currentCity = citySelect?.value;
        
        if (!currentCity) {
            showToast('Please select a city first', 'warning');
            return;
        }
        
        const favorites = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
        const index = favorites.indexOf(currentCity);
        
        if (index > -1) {
            favorites.splice(index, 1);
            showToast('Removed from favorites', 'info');
        } else {
            if (favorites.length >= 5) {
                showToast('Maximum 5 favorites allowed', 'warning');
                return;
            }
            favorites.push(currentCity);
            showToast('Added to favorites', 'success');
        }
        
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        updateFavoritesPills();
    }
});

/**
 * Update Favorites Pills
 */
function updateFavoritesPills() {
    const container = document.getElementById('favoritesPills');
    if (!container) return;
    
    const favorites = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
    
    if (favorites.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = favorites.map(city => `
        <button class="favorite-pill" data-city="${city}">
            ${city}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 0.5rem;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.favorite-pill').forEach(pill => {
        pill.addEventListener('click', function() {
            const city = this.dataset.city;
            const citySelect = document.getElementById('citySelect');
            if (citySelect) {
                citySelect.value = city;
                document.getElementById('fetchBtn')?.click();
            }
        });
    });
}

// Initialize favorites on load
updateFavoritesPills();

/**
 * Chart Period Controls (24H / Week)
 */
function initChartControls() {
    const chartButtons = document.querySelectorAll('.chart-btn');
    console.log('Chart controls initialized, buttons found:', chartButtons.length);
    
    chartButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Check if chart is ready
            if (!window.trendChart) {
                console.error('Chart not initialized yet!');
                return;
            }
            
            const period = this.dataset.period;
            console.log('Chart period button clicked:', period);
            
            // Update active state
            chartButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update chart title
            const chartHeader = document.querySelector('.chart-header h2');
            if (chartHeader) {
                if (period === '24h') {
                    chartHeader.textContent = '24-Hour AQI Trend';
                } else if (period === 'week') {
                    chartHeader.textContent = '7-Day AQI Trend';
                }
            }
            
            // Generate data based on period
            let labels = [];
            let dataPoints = [];
            const now = new Date();
            
            if (period === '24h') {
                // 24 hours - hourly data
                for (let i = 23; i >= 0; i--) {
                    const time = new Date(now - i * 3600000);
                    labels.push(time.getHours() + ':00');
                    const baseValue = 50 + Math.random() * 100;
                    const variation = Math.sin(i / 4) * 20;
                    dataPoints.push(Math.max(10, Math.round(baseValue + variation)));
                }
            } else if (period === 'week') {
                // 7 days - daily data
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(now - i * 86400000);
                    labels.push(days[date.getDay()]);
                    const baseValue = 60 + Math.random() * 80;
                    const variation = Math.sin(i / 2) * 25;
                    dataPoints.push(Math.max(20, Math.round(baseValue + variation)));
                }
            }
            
            // Update chart
            console.log('Updating chart with new data:', {
                period: period,
                labelCount: labels.length,
                dataPointCount: dataPoints.length,
                firstLabel: labels[0],
                lastLabel: labels[labels.length - 1]
            });
            
            window.trendChart.data.labels = labels;
            window.trendChart.data.datasets[0].data = dataPoints;
            window.trendChart.update();
            
            console.log('Chart updated successfully');
        });
    });
}

console.log('✨ Modern AQI Dashboard features initialized!');
