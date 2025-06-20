// Mobile orientation fix for iOS Safari and other stubborn browsers
export function initializeMobileOrientation() {
  // Ensure this only runs on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!isMobile) return;

  // Function to handle orientation changes
  function handleOrientationChange() {
    // Force a layout recalculation after orientation change
    setTimeout(() => {
      // Trigger a resize event to ensure proper layout
      window.dispatchEvent(new Event('resize'));
      
      // Force viewport recalculation
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const content = viewport.getAttribute('content');
        viewport.setAttribute('content', content);
      }
    }, 100);
  }

  // Listen for orientation changes
  if (screen.orientation) {
    screen.orientation.addEventListener('change', handleOrientationChange);
  } else {
    // Fallback for older browsers
    window.addEventListener('orientationchange', handleOrientationChange);
  }

  // Initial setup
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure viewport meta tag is properly set
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    // Set comprehensive viewport content
    viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover';
    
    // iOS Safari specific fixes
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Prevent iOS from disabling rotation in certain circumstances
      document.body.style.minHeight = '100vh';
      document.documentElement.style.minHeight = '100vh';
      
      // Add touch-action to ensure proper touch handling
      document.body.style.touchAction = 'manipulation';
    }
  });

  // Additional iOS Safari orientation unlock attempts
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Try to unlock orientation on first user interaction
    const unlockOrientation = () => {
      // Request fullscreen briefly and exit to unlock orientation
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => {
            setTimeout(() => {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }, 100);
          })
          .catch(() => {
            // Ignore errors, this is just a fallback attempt
          });
      }
      
      // Remove the event listener after first attempt
      document.removeEventListener('touchstart', unlockOrientation);
    };
    
    // Attach to first touch
    document.addEventListener('touchstart', unlockOrientation, { once: true });
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  initializeMobileOrientation();
}
