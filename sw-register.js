// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered successfully:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                showUpdateToast();
              }
            });
          }
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            showUpdateToast();
          }
        });
      })
      .catch((error) => {
        console.log('[SW] Registration failed:', error);
      });
  });
}

// Request notification permission
if ('Notification' in window && navigator.serviceWorker) {
  if (Notification.permission === 'default') {
    // Ask for permission after user interaction
    document.addEventListener('click', requestNotificationPermission, { once: true });
  }
}

function requestNotificationPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('[SW] Notification permission granted');
    }
  });
}

function showUpdateToast() {
  // Create update notification
  const updateToast = document.createElement('div');
  updateToast.className = 'toast update-toast';
  updateToast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 0l-3-3m3 3l3-3"/>
    </svg>
    <div class="toast-content">
      <span class="toast-message">Update available! Refresh to get the latest version.</span>
      <button id="updateBtn" class="toast-action">Update Now</button>
    </div>
  `;

  document.getElementById('toastContainer')?.appendChild(updateToast);

  document.getElementById('updateBtn')?.addEventListener('click', () => {
    window.location.reload();
  });

  // Auto-remove after 10 seconds
  setTimeout(() => {
    updateToast.remove();
  }, 10000);
}

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;

  // Show install button or toast
  showInstallPrompt();
});

function showInstallPrompt() {
  const installToast = document.createElement('div');
  installToast.className = 'toast install-toast';
  installToast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <div class="toast-content">
      <span class="toast-message">Install AQI Monitor for offline access!</span>
      <button id="installBtn" class="toast-action">Install</button>
    </div>
  `;

  document.getElementById('toastContainer')?.appendChild(installToast);

  document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      deferredPrompt = null;
    }
    installToast.remove();
  });

  // Auto-remove after 8 seconds
  setTimeout(() => {
    installToast.remove();
  }, 8000);
}
