// Mobile orientation fix for iOS Safari and other stubborn browsers
export function initializeMobileOrientation() {
  // Ensure this only runs on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile && !('ontouchstart' in window)) return;

  // Aggressive viewport setup
  function setupViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    // Comprehensive viewport settings
    viewport.content = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
  }

  // Force orientation unlock
  function forceOrientationUnlock() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock().catch(() => {
        // Ignore errors, this is normal
      });
    }
    
    // Remove any CSS that might lock orientation
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        -webkit-transform: none !important;
        -moz-transform: none !important;
        -ms-transform: none !important;
        transform: none !important;
      }
      @media screen and (orientation: portrait) {
        html, body { -webkit-transform: none !important; transform: none !important; }
      }
      @media screen and (orientation: landscape) {
        html, body { -webkit-transform: none !important; transform: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // Function to handle orientation changes
  function handleOrientationChange() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      setupViewport();
    }, 100);
  }

  // Multiple event listeners for orientation changes
  if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientationChange);
  }
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  // Initial setup
  document.addEventListener('DOMContentLoaded', () => {
    setupViewport();
    forceOrientationUnlock();
    
    // iOS Safari specific fixes
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.body.style.minHeight = '100vh';
      document.documentElement.style.minHeight = '100vh';
      
      // Fix iOS Safari viewport issues
      const fixIOSViewport = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      fixIOSViewport();
      window.addEventListener('resize', fixIOSViewport);
      window.addEventListener('orientationchange', () => setTimeout(fixIOSViewport, 100));
    }
  });
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  initializeMobileOrientation();
}
