function refreshCurrent() {
  const stored = parseInt(localStorage.getItem('aqiThreshold') || '', 10);
  const current = Number.isNaN(stored) ? 150 : stored;
  document.getElementById('currentThresholdText').textContent = `Current threshold: ${current}`;
  document.getElementById('thresholdInput').value = current;
}

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('thresholdInput');
  const saveBtn = document.getElementById('saveThresholdBtn');
  const testBtn = document.getElementById('testAlertBtn');
  const demoAlert = document.getElementById('demoAlert');
  const alertLocation = document.getElementById('alertLocation');

  refreshCurrent();

  // Show current city context if available
  const params = new URLSearchParams(location.search);
  const city = params.get('city') || (localStorage.getItem('selectedCity') || '').trim();
  if (city && alertLocation) {
    alertLocation.textContent = `Currently monitoring: ${city}`;
  }

  saveBtn.addEventListener('click', () => {
    const val = parseInt(input.value, 10);
    if (Number.isNaN(val) || val < 0 || val > 500) {
      alert('Please enter a valid AQI threshold between 0 and 500.');
      return;
    }
    localStorage.setItem('aqiThreshold', String(val));
    refreshCurrent();
    alert('Saved! Dashboard will use this threshold.');
  });

  testBtn.addEventListener('click', () => {
    // Toggle demo alert visibility
    if (demoAlert.style.display === 'none') {
      demoAlert.style.display = 'flex';
      demoAlert.classList.add('show');
    } else {
      demoAlert.style.display = 'none';
      demoAlert.classList.remove('show');
    }
  });
});
