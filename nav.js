window.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.split('/').pop().toLowerCase() || 'index.html';
  const params = new URLSearchParams(location.search);
  const currentCity = params.get('city') || (localStorage.getItem('selectedCity') || '').trim();

  console.log('=== NAV DEBUG ===');
  console.log('Current path:', path);
  console.log('Full pathname:', location.pathname);

  // Support both old (.top-nav) and new (.main-nav) navigation structures
  const navSelectors = [
    '.main-nav .nav-menu .nav-link',  // New navigation
    '.top-nav .nav-links a'            // Old navigation
  ];

  navSelectors.forEach(selector => {
    const links = document.querySelectorAll(selector);
    console.log(`Found ${links.length} links with selector: ${selector}`);
    
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      
      const page = href.split('?')[0].toLowerCase();
      console.log(`Link href: ${href}, Page: ${page}, Match: ${page === path}`);

      // Active state - match both with and without trailing slash
      const isMatch = page === path || 
                      page === `/${path}` || 
                      (path === 'index.html' && (page === '' || page === '/' || page === 'index.html'));
      
      if (isMatch) {
        a.classList.add('active');
        console.log('Added active class to:', href);
      } else {
        a.classList.remove('active');
      }

      // Propagate city to links
      if (currentCity) {
        try {
          const url = new URL(href, location.origin);
          url.searchParams.set('city', currentCity);
          a.setAttribute('href', url.pathname.replace(/\\/g, '/') + url.search);
        } catch (e) {
          console.warn('Error processing navigation link:', href, e);
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
