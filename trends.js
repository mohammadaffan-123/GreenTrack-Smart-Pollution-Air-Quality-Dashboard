let trendsChart;
let currentBandColor = null;

function getChartTheme() {
  const root = getComputedStyle(document.documentElement);
  const getVar = (v, f) => (root.getPropertyValue(v).trim() || f);
  const text = getVar('--text-primary', '#e8eaf6');
  const textMuted = getVar('--text-secondary', '#9fa8da');
  const grid = getVar('--border-color', 'rgba(42, 51, 89, 0.5)');
  const lineColor = '#667eea';
  const fillColor = 'rgba(102, 126, 234, 0.10)';
  const tooltipBg = document.body.classList.contains('theme-light') ? 'rgba(255,255,255,0.95)' : 'rgba(26,33,64,0.95)';
  const pointBorder = '#ffffff';
  return { text, textMuted, grid, lineColor, fillColor, tooltipBg, pointBorder };
}

function initTrendsChart(ctx, data) {
  if (trendsChart) trendsChart.destroy();
  const theme = getChartTheme();
  trendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'PM2.5 Concentration (μg/m³)',
        data: data.values,
        borderColor: theme.lineColor,
        backgroundColor: theme.fillColor,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: theme.lineColor,
        pointBorderColor: theme.pointBorder,
        pointBorderWidth: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: theme.text } },
        tooltip: { backgroundColor: theme.tooltipBg, titleColor: theme.text, bodyColor: theme.textMuted }
      },
      scales: {
        x: { ticks: { color: theme.textMuted }, grid: { color: theme.grid } },
        y: { ticks: { color: theme.textMuted }, grid: { color: theme.grid }, beginAtZero: true }
      }
    }
  });
}

async function loadTrends(city) {
  const title = document.getElementById('trendLocation');
  const { data } = await AQI.fetchAQIData(city);
  title.textContent = `${data.city}`;
  const series = AQI.generateMockHistoricalData();
  const ctx = document.getElementById('trendPageChart').getContext('2d');
  initTrendsChart(ctx, series);

  // Derive band color from latest AQI and tint the chart
  try {
    const level = AQI.getAQILevel(data.aqi);
    const band = getAqiBandColor(level.class);
    currentBandColor = band;
    if (trendsChart && band) {
      trendsChart.data.datasets[0].borderColor = band;
      trendsChart.data.datasets[0].backgroundColor = hexToRgba(band, 0.12);
      trendsChart.data.datasets[0].pointBackgroundColor = band;
      trendsChart.update('none');
    }
  } catch (e) {
    // Ignore if CSS vars missing; keep theme colors
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('trendCityInput');
  const btn = document.getElementById('trendFetchBtn');
  const cityFromQuery = AQI.getCityFromQuery();
  const savedCity = localStorage.getItem('selectedCity');
  const initialCity = cityFromQuery || (savedCity && savedCity.trim()) || AQI.CONFIG.defaultCity;
  input.value = initialCity;
  // Ensure URL reflects the chosen city for shareability
  {
    const url = new URL(location.href);
    url.searchParams.set('city', initialCity);
    history.replaceState({}, '', url);
  }
  loadTrends(initialCity);

  btn.addEventListener('click', () => {
    const city = input.value.trim();
    if (!city) return;
    // Persist and reflect in URL
    localStorage.setItem('selectedCity', city);
    const url = new URL(location.href);
    url.searchParams.set('city', city);
    history.replaceState({}, '', url);
    loadTrends(city);
  });

  // React to theme change
  window.addEventListener('theme-changed', () => {
    if (trendsChart) {
      const t = getChartTheme();
      trendsChart.options.plugins.legend.labels.color = t.text;
      trendsChart.options.plugins.tooltip.backgroundColor = t.tooltipBg;
      trendsChart.options.plugins.tooltip.titleColor = t.text;
      trendsChart.options.plugins.tooltip.bodyColor = t.textMuted;
      trendsChart.options.scales.x.grid.color = t.grid;
      trendsChart.options.scales.y.grid.color = t.grid;
      trendsChart.options.scales.x.ticks.color = t.textMuted;
      trendsChart.options.scales.y.ticks.color = t.textMuted;
      // Preserve band color if we have one; otherwise use theme default
      const line = currentBandColor || t.lineColor;
      const fill = currentBandColor ? hexToRgba(currentBandColor, 0.12) : t.fillColor;
      trendsChart.data.datasets[0].borderColor = line;
      trendsChart.data.datasets[0].backgroundColor = fill;
      trendsChart.data.datasets[0].pointBackgroundColor = line;
      trendsChart.data.datasets[0].pointBorderColor = t.pointBorder;
      trendsChart.update('none');
    }
  });
});

// Helpers for band color mapping
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
  const root = getComputedStyle(document.documentElement);
  const val = root.getPropertyValue(varName).trim();
  return val || null;
}

function hexToRgba(hex, alpha) {
  if (!hex) return null;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
