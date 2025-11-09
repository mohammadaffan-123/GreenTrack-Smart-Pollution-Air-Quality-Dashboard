(function (global) {
  const CONFIG = {
    apiUrl: 'https://api.waqi.info/feed',
    apiKey: 'b784e806f701bc0a79adaf50855b32f8acc0d234',
    defaultCity: 'New Delhi',
    criticalAqiThreshold: 150,
    refreshInterval: 600000
  };

  // Override threshold from localStorage if present
  const storedThreshold = parseInt(localStorage.getItem('aqiThreshold') || '', 10);
  if (!Number.isNaN(storedThreshold)) {
    CONFIG.criticalAqiThreshold = storedThreshold;
  }

  const LEVELS = {
    good: { min: 0, max: 50, label: 'Good', class: 'good' },
    moderate: { min: 51, max: 100, label: 'Moderate', class: 'moderate' },
    unhealthySensitive: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', class: 'unhealthy-sensitive' },
    unhealthy: { min: 151, max: 200, label: 'Unhealthy', class: 'unhealthy' },
    veryUnhealthy: { min: 201, max: 300, label: 'Very Unhealthy', class: 'very-unhealthy' },
    hazardous: { min: 301, max: Infinity, label: 'Hazardous', class: 'hazardous' }
  };

  function processAQIData(rawData) {
    // Extract and validate temperature (must be between -50 and 60 Celsius)
    let temp = rawData.iaqi?.t?.v || null;
    if (temp !== null && (temp < -50 || temp > 60)) {
      console.warn('Temperature out of range:', temp, '- setting to null');
      temp = null;
    }
    
    // Extract pollutant values, treating 999 as null (sensor error)
    const pollutants = {
      pm25: rawData.iaqi?.pm25?.v === 999 ? null : (rawData.iaqi?.pm25?.v || null),
      pm10: rawData.iaqi?.pm10?.v === 999 ? null : (rawData.iaqi?.pm10?.v || null),
      o3: rawData.iaqi?.o3?.v === 999 ? null : (rawData.iaqi?.o3?.v || null),
      no2: rawData.iaqi?.no2?.v === 999 ? null : (rawData.iaqi?.no2?.v || null),
      so2: rawData.iaqi?.so2?.v === 999 ? null : (rawData.iaqi?.so2?.v || null),
      co: rawData.iaqi?.co?.v === 999 ? null : (rawData.iaqi?.co?.v || null)
    };
    
    // If API returns 999 for AQI, recalculate from available pollutants
    let finalAqi = rawData.aqi;
    if (finalAqi === 999) {
      console.warn('API returned 999 AQI, recalculating from pollutants');
      // Use PM2.5 as primary indicator if available
      const validPollutants = Object.values(pollutants).filter(v => v !== null);
      if (pollutants.pm25 !== null) {
        finalAqi = pollutants.pm25;
      } else if (validPollutants.length > 0) {
        finalAqi = Math.max(...validPollutants);
      } else {
        finalAqi = null;
      }
    }
    
    return {
      aqi: finalAqi !== undefined && finalAqi !== null && finalAqi !== 999 ? finalAqi : null,
      city: rawData.city?.name || 'Unknown',
      time: rawData.time?.s || new Date().toISOString(),
      pollutants: pollutants,
      weather: {
        temperature: temp,
        humidity: rawData.iaqi?.h?.v || null,
        pressure: rawData.iaqi?.p?.v || null,
        windSpeed: rawData.iaqi?.w?.v || null,
        windGust: rawData.iaqi?.wg?.v || null,
        dewPoint: rawData.iaqi?.dew?.v || null
      },
      dominantPollutant: rawData.dominentpol || 'N/A'
    };
  }

  function getMockData(cityName) {
    const mockAqi = Math.floor(Math.random() * 250) + 50;
    return {
      aqi: mockAqi,
      city: cityName || 'Unknown',
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
        humidity: Math.floor(Math.random() * 60) + 30,
        pressure: Math.floor(Math.random() * 50) + 990,
        windSpeed: (Math.random() * 10 + 2).toFixed(1),
        windGust: (Math.random() * 15 + 5).toFixed(1),
        dewPoint: Math.floor(Math.random() * 20) + 5
      },
      dominantPollutant: 'pm25'
    };
  }

  function getAQILevel(aqi) {
    for (const level of Object.values(LEVELS)) {
      if (aqi >= level.min && aqi <= level.max) return level;
    }
    return LEVELS.hazardous;
  }

  async function fetchAQIData(city) {
    try {
      const url = `${CONFIG.apiUrl}/${encodeURIComponent(city)}/?token=${CONFIG.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status !== 'ok') throw new Error('API returned error status');
      return { data: processAQIData(data.data), isMock: false };
    } catch (err) {
      console.warn('Falling back to mock data:', err.message);
      return { data: getMockData(city), isMock: true };
    }
  }

  function generateMockHistoricalData() {
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
  }

  function getCityFromQuery() {
    const params = new URLSearchParams(location.search);
    const qCity = params.get('city');
    return qCity || null;
  }

  global.AQI = {
    CONFIG,
    LEVELS,
    fetchAQIData,
    processAQIData,
    getMockData,
    getAQILevel,
    generateMockHistoricalData,
    getCityFromQuery
  };
})(window);
