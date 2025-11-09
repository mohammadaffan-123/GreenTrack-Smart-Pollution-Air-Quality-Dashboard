window.addEventListener('DOMContentLoaded', () => {
  // Get the current page filename
  const path = location.pathname.split('/').pop().toLowerCase() || 'index.html';
  const params = new URLSearchParams(location.search);
  const currentCity = params.get('city') || (localStorage.getItem('selectedCity') || '').trim();

  console.log('=== NAV DEBUG ===');
  console.log('Current path:', path);
  console.log('Full pathname:', location.pathname);
  console.log('Location origin:', location.origin);
  console.log('Current city:', currentCity);

  // Get the base path (important for GitHub Pages)
  // For GitHub Pages: /repo-name/
  // For localhost: /
  const basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
  console.log('Base path:', basePath);

  // Support both old (.top-nav) and new (.main-nav) navigation structures
  const navSelectors = [
    '.main-nav .nav-menu .nav-link',  // New navigation
    '.top-nav .nav-links a'            // Old navigation
  ];

  navSelectors.forEach(selector => {
    const links = document.querySelectorAll(selector);
    console.log(`Found ${links.length} links with selector: ${selector}`);
    
    links.forEach(a => {
      const originalHref = a.getAttribute('href');
      if (!originalHref) return;
      
      // Extract just the filename from the href
      const filename = originalHref.split('?')[0].split('/').pop().toLowerCase();
      console.log(`Link original href: ${originalHref}, Filename: ${filename}, Match: ${filename === path}`);

      // Active state - match by filename only
      const isMatch = filename === path || 
                      (path === 'index.html' && (filename === '' || filename === '/' || filename === 'index.html'));
      
      if (isMatch) {
        a.classList.add('active');
        console.log('Added active class to:', originalHref);
      } else {
        a.classList.remove('active');
      }

      // Propagate city to links - keep the link relative
      if (currentCity) {
        try {
          // Keep it simple - just add/update query params to the filename
          const searchParams = new URLSearchParams();
          searchParams.set('city', currentCity);
          
          // If the original href has a query string, preserve other params
          const [file, query] = originalHref.split('?');
          if (query) {
            const existingParams = new URLSearchParams(query);
            existingParams.forEach((value, key) => {
              if (key !== 'city') {
                searchParams.set(key, value);
              }
            });
          }
          
          // Set the href to just filename + params (stays relative)
          const newHref = file + '?' + searchParams.toString();
          a.setAttribute('href', newHref);
          console.log(`Updated href from ${originalHref} to ${newHref}`);
        } catch (e) {
          console.warn('Error processing navigation link:', originalHref, e);
        }
      }
    });
  });

  // Mobile menu toggle for new navigation
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.main-nav')) {
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      }
    });
    
    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
      });
    });
  }
});
