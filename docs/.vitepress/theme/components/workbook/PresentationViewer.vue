<!-- PresentationViewer.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useData } from 'vitepress';

// Props for the component
const props = defineProps({
  // Media properties
  mediaType: {
    type: String,
    default: 'video'
  },
  mediaUrl: {
    type: String,
    required: true
  },
  mediaProvider: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  
  // Content metadata
  title: {
    type: String,
    default: ''
  },
  
  // Presentation options
  presentation: {
    type: Object,
    default: () => ({
      enabled: true,
      autoplay: false,
      loop: true,
      showControls: true,
      startTime: 0,
      endTime: null,
      backgroundMode: 'blurred',
      accentColor: null
    })
  },
  
  // Technical details
  technicalDetails: {
    type: Object,
    default: () => ({
      tools: [],
      format: '',
      duration: ''
    })
  }
});

// Emits
const emit = defineEmits(['close']);

// Get VitePress data
const { page } = useData();

// State
const isActive = ref(true);
const isFullscreen = ref(false);
const isPlaying = ref(props.presentation.autoplay || false);
const showControls = ref(true);
const controlsTimer = ref(null);
const isMuted = ref(false);
const volume = ref(1);
const playerRef = ref(null);
const containerRef = ref(null);
const isCasting = ref(false);
const castingAvailable = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const loadedProgress = ref(0);
const playedProgress = ref(0);
const timeUpdateInterval = ref(null);
const monitorIntervalId = ref(null);

// Computed values
const backgroundStyle = computed(() => {
  if (props.presentation.backgroundMode === 'blurred') {
    return {
      backgroundImage: `url(${props.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(20px) brightness(0.3)',
      opacity: 0.8
    };
  } else if (props.presentation.backgroundMode === 'color') {
    const color = props.presentation.accentColor || '#000000';
    return {
      backgroundColor: color,
      opacity: 0.9
    };
  } else {
    return {
      backgroundColor: '#000000'
    };
  }
});

const accentColor = computed(() => {
  return props.presentation.accentColor || '#ffffff';
});

// Methods
function close() {
  isActive.value = false;
  
  // Update URL to remove presentation parameter
  const url = new URL(window.location.href);
  url.searchParams.delete('presentation');
  window.history.replaceState({}, '', url.toString());
  
  // Emit close event
  emit('close');
}

function togglePlay() {
  if (props.mediaType === 'video') {
    if (props.mediaProvider === 'vimeo') {
      // Use our direct methods which have fallbacks built in
      if (isPlaying.value) {
        directVimeoPause();
      } else {
        directVimeoPlay();
      }
    } else if (props.mediaProvider === 'youtube') {
      toggleYouTubePlayback();
    } else if (playerRef.value) {
      // Native HTML5 video player
      if (isPlaying.value) {
        playerRef.value.pause();
      } else {
        playerRef.value.play();
      }
      isPlaying.value = !isPlaying.value;
    }
  } else if (props.mediaType === 'audio' && playerRef.value) {
    // Native HTML5 audio player
    if (isPlaying.value) {
      playerRef.value.pause();
    } else {
      playerRef.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
}

// Handle Vimeo iframe playback
function toggleVimeoPlayback() {
  if (!playerRef.value) return;
  
  // Try Vimeo Player API first
  if (window.Vimeo && Vimeo.Player) {
    const player = new Vimeo.Player(playerRef.value);
    
    player.getPaused().then(paused => {
      if (paused) {
        player.play().then(() => {
          isPlaying.value = true;
        }).catch(error => {
          console.error('Error playing Vimeo video:', error);
        });
      } else {
        player.pause().then(() => {
          isPlaying.value = false;
        }).catch(error => {
          console.error('Error pausing Vimeo video:', error);
        });
      }
    }).catch(error => {
      console.error('Error checking Vimeo video state:', error);
      // Fallback to postMessage API
      postMessageToVimeoIframe();
    });
  } else {
    // Fallback to postMessage API
    postMessageToVimeoIframe();
  }
}

// Fallback method to control Vimeo player via postMessage
function postMessageToVimeoIframe() {
  const iframe = playerRef.value;
  if (!iframe || !iframe.contentWindow) return;
  
  const command = isPlaying.value ? 'pause' : 'play';
  const url = new URL(iframe.src);
  const vimeoId = url.pathname.split('/').pop();
  
  iframe.contentWindow.postMessage({
    method: command,
    value: 1
  }, '*');
  
  // Update local state (this may get overridden by iframe events later)
  isPlaying.value = !isPlaying.value;
}

// Handle YouTube iframe playback
function toggleYouTubePlayback() {
  if (!playerRef.value) return;
  
  // YouTube iframe API requires the iframe to have an ID
  const iframe = playerRef.value;
  if (!iframe.id) {
    iframe.id = 'youtube-player-' + Date.now();
  }
  
  // Check if YouTube API is available
  if (typeof YT !== 'undefined' && YT.Player) {
    const player = new YT.Player(iframe.id);
    
    // Toggle playback based on current state
    if (isPlaying.value) {
      player.pauseVideo();
      isPlaying.value = false;
    } else {
      player.playVideo();
      isPlaying.value = true;
    }
  } else {
    // Fallback method when YouTube API is not available
    const message = isPlaying.value ? 'pauseVideo' : 'playVideo';
    iframe.contentWindow.postMessage('{"event":"command","func":"' + message + '","args":""}', '*');
    isPlaying.value = !isPlaying.value;
  }
}

function toggleMute() {
  if (props.mediaType === 'video') {
    if (props.mediaProvider === 'vimeo' && playerRef.value) {
      const player = new Vimeo.Player(playerRef.value);
      player.getVolume().then(volume => {
        if (volume > 0) {
          player.setVolume(0);
          isMuted.value = true;
        } else {
          player.setVolume(1);
          isMuted.value = false;
        }
      });
    } else if (props.mediaProvider === 'youtube') {
      // Handle YouTube mute toggle
      const iframe = playerRef.value;
      if (iframe && iframe.contentWindow) {
        const message = isMuted.value ? 'unMute' : 'mute';
        iframe.contentWindow.postMessage('{"event":"command","func":"' + message + '","args":""}', '*');
        isMuted.value = !isMuted.value;
      }
    } else if (playerRef.value) {
      // Handle native video player
      isMuted.value = !isMuted.value;
      playerRef.value.muted = isMuted.value;
    }
  } else if (props.mediaType === 'audio' && playerRef.value) {
    // Handle audio player
    isMuted.value = !isMuted.value;
    playerRef.value.muted = isMuted.value;
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (containerRef.value.requestFullscreen) {
      containerRef.value.requestFullscreen();
    } else if (containerRef.value.webkitRequestFullscreen) {
      containerRef.value.webkitRequestFullscreen();
    } else if (containerRef.value.msRequestFullscreen) {
      containerRef.value.msRequestFullscreen();
    }
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    isFullscreen.value = false;
  }
}

// Toggle casting function
function toggleCast() {
  if (!playerRef.value || props.mediaProvider !== 'vimeo') return;
  
  if (window.Vimeo && Vimeo.Player) {
    try {
      const player = new Vimeo.Player(playerRef.value);
      
      // Check if Chromecast methods exist before calling them
      if (typeof player.enableChromecast === 'function' && typeof player.disableChromecast === 'function') {
        if (!isCasting.value) {
          // Start casting
          player.enableChromecast().then(() => {
            isCasting.value = true;
            console.log('Casting enabled');
          }).catch(error => {
            console.error('Error enabling casting:', error);
            // Try alternative method
            alternativeCastingMethod();
          });
        } else {
          // Stop casting
          player.disableChromecast().then(() => {
            isCasting.value = false;
            console.log('Casting disabled');
          }).catch(error => {
            console.error('Error disabling casting:', error);
            // Try alternative method
            alternativeCastingMethod();
          });
        }
      } else {
        // Chromecast API not available, try workaround
        console.log('Vimeo Chromecast API not available, using alternative method');
        alternativeCastingMethod();
      }
    } catch (error) {
      console.error('Error with Vimeo player for casting:', error);
      // Try alternative method
      alternativeCastingMethod();
    }
  } else {
    // Try alternative method if Vimeo API is not available
    alternativeCastingMethod();
  }
}

// Alternative method using postMessage API
function alternativeCastingMethod() {
  if (!playerRef.value || !playerRef.value.contentWindow) return;
  
  try {
    // Try opening the native Vimeo cast menu by searching for and clicking the cast button
    // This is a workaround since Vimeo doesn't officially document a casting API
    
    // First, set a flag indicating we're trying to cast so we can update the UI
    isCasting.value = !isCasting.value;
    
    // Since we don't have direct control, inform the user
    const action = isCasting.value ? 'enable' : 'disable';
    console.log(`Attempting to ${action} casting via alternative method`);
    
    // Try to use the browser's native Cast API if available
    if (window.chrome && window.chrome.cast && window.chrome.cast.requestSession) {
      try {
        if (isCasting.value) {
          window.chrome.cast.requestSession(
            function(session) {
              console.log('Cast session started:', session);
            },
            function(error) {
              console.error('Cast session error:', error);
              // Revert state if failed
              isCasting.value = false;
            }
          );
        } else {
          // Try to stop casting if a session exists
          const session = window.chrome.cast.getCurrentSession();
          if (session) {
            session.stop();
          }
        }
      } catch (e) {
        console.error('Error using Chrome Cast API:', e);
      }
    }
    
    // We don't have a reliable way to confirm if casting actually started
    // so we'll just update the UI based on the intended action
  } catch (e) {
    console.error('Error using alternative casting method:', e);
    // Revert the casting state on error
    isCasting.value = !isCasting.value;
  }
}

// Check if casting is available
function checkCastingAvailability() {
  if (!playerRef.value || props.mediaProvider !== 'vimeo') return;
  
  // For now, we'll just assume Chromecast is available if the browser supports it
  // This is a simplified approach since Vimeo Player API doesn't expose a direct method
  // to check Chromecast availability
  
  // Check if Chrome browser (which is most likely to support Chromecast)
  const isChromeBrowser = navigator.userAgent.indexOf('Chrome') !== -1;
  
  // Simpler check: we'll default to true on Chrome browsers
  castingAvailable.value = isChromeBrowser;
  
  // We'll check for errors when trying to cast rather than preventing the button
  // from appearing, to avoid false negatives
}

// Format time in MM:SS format
function formatTime(timeInSeconds) {
  if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
  
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Seek to position based on click in progress bar
function seekToPosition(event) {
  if (!playerRef.value) return;
  
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = (event.clientX - rect.left) / rect.width;
  
  // Calculate the time to seek to
  const seekTime = clickPosition * duration.value;
  
  if (props.mediaProvider === 'vimeo') {
    seekVimeoVideo(seekTime);
  } else if (props.mediaProvider === 'youtube') {
    seekYouTubeVideo(seekTime);
  } else if (playerRef.value.currentTime !== undefined) {
    // Native HTML5 video/audio player
    playerRef.value.currentTime = seekTime;
    currentTime.value = seekTime;
    updatePlayedProgress();
  }
}

// Seek Vimeo video
function seekVimeoVideo(seekTime) {
  if (window.Vimeo && Vimeo.Player) {
    try {
      const player = new Vimeo.Player(playerRef.value);
      player.setCurrentTime(seekTime).then(() => {
        currentTime.value = seekTime;
        updatePlayedProgress();
      }).catch(error => {
        console.error('Error seeking Vimeo video:', error);
        
        // Try alternative method
        try {
          playerRef.value.contentWindow.postMessage({
            method: 'setCurrentTime',
            value: seekTime
          }, '*');
          
          currentTime.value = seekTime;
          updatePlayedProgress();
        } catch (e) {
          console.error('Error with alternative Vimeo seeking:', e);
        }
      });
    } catch (error) {
      console.error('Error creating Vimeo player for seeking:', error);
    }
  } else {
    // Try direct postMessage API
    try {
      playerRef.value.contentWindow.postMessage({
        method: 'setCurrentTime',
        value: seekTime
      }, '*');
      
      currentTime.value = seekTime;
      updatePlayedProgress();
    } catch (e) {
      console.error('Error with direct Vimeo seeking:', e);
    }
  }
}

// Seek YouTube video
function seekYouTubeVideo(seekTime) {
  if (typeof YT !== 'undefined' && YT.Player) {
    try {
      const player = new YT.Player(playerRef.value);
      player.seekTo(seekTime, true);
      currentTime.value = seekTime;
      updatePlayedProgress();
    } catch (error) {
      console.error('Error seeking YouTube video:', error);
      
      // Try alternative method
      try {
        playerRef.value.contentWindow.postMessage(
          '{"event":"command","func":"seekTo","args":[' + seekTime + ',true]}',
          '*'
        );
        
        currentTime.value = seekTime;
        updatePlayedProgress();
      } catch (e) {
        console.error('Error with alternative YouTube seeking:', e);
      }
    }
  } else {
    // Try direct postMessage API
    try {
      playerRef.value.contentWindow.postMessage(
        '{"event":"command","func":"seekTo","args":[' + seekTime + ',true]}',
        '*'
      );
      
      currentTime.value = seekTime;
      updatePlayedProgress();
    } catch (e) {
      console.error('Error with direct YouTube seeking:', e);
    }
  }
}

// Update played progress percentage
function updatePlayedProgress() {
  if (duration.value > 0) {
    playedProgress.value = (currentTime.value / duration.value) * 100;
  } else {
    playedProgress.value = 0;
  }
}

// Start time tracking for media
function startTimeTracking() {
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value);
  }
  
  // Check the type of player and use appropriate time tracking method
  if (props.mediaProvider === 'vimeo') {
    trackVimeoTime();
  } else if (props.mediaProvider === 'youtube') {
    trackYouTubeTime();
  } else if (playerRef.value) {
    // For native HTML5 players, we can use the timeupdate event
    playerRef.value.addEventListener('timeupdate', () => {
      currentTime.value = playerRef.value.currentTime;
      duration.value = playerRef.value.duration || 0;
      updatePlayedProgress();
      
      // Update loaded progress for HTML5 video/audio
      if (playerRef.value.buffered && playerRef.value.buffered.length > 0) {
        const bufferedEnd = playerRef.value.buffered.end(playerRef.value.buffered.length - 1);
        loadedProgress.value = (bufferedEnd / duration.value) * 100;
      }
    });
  }
}

// Track Vimeo video time using API
function trackVimeoTime() {
  if (!playerRef.value) return;
  
  // Create interval to poll for time updates
  timeUpdateInterval.value = setInterval(() => {
    if (window.Vimeo && Vimeo.Player) {
      try {
        const player = new Vimeo.Player(playerRef.value);
        
        // Get current time
        player.getCurrentTime().then(time => {
          currentTime.value = time;
          updatePlayedProgress();
        }).catch(e => {
          // Ignore errors
        });
        
        // Get duration
        player.getDuration().then(totalDuration => {
          duration.value = totalDuration;
          updatePlayedProgress();
        }).catch(e => {
          // Ignore errors
        });
        
        // Get loaded progress
        player.getBuffered().then(buffered => {
          if (buffered && buffered.length > 0) {
            loadedProgress.value = (buffered[0][1] / duration.value) * 100;
          }
        }).catch(e => {
          // Set a reasonable default for loaded progress
          loadedProgress.value = playedProgress.value + 20;
          // Ignore errors
        });
      } catch (e) {
        // Ignore errors
      }
    }
  }, 1000); // Update every second
}

// Track YouTube video time using API
function trackYouTubeTime() {
  if (!playerRef.value) return;
  
  // Create interval to poll for time updates
  timeUpdateInterval.value = setInterval(() => {
    if (typeof YT !== 'undefined' && YT.Player) {
      try {
        const player = new YT.Player(playerRef.value);
        
        // Get current time
        const time = player.getCurrentTime();
        if (!isNaN(time)) {
          currentTime.value = time;
        }
        
        // Get duration
        const totalDuration = player.getDuration();
        if (!isNaN(totalDuration)) {
          duration.value = totalDuration;
        }
        
        // Get loaded progress
        const loaded = player.getVideoLoadedFraction();
        if (!isNaN(loaded)) {
          loadedProgress.value = loaded * 100;
        }
        
        updatePlayedProgress();
      } catch (e) {
        // Ignore errors
      }
    }
  }, 1000); // Update every second
}

function setVolume(event) {
  const newVolume = parseFloat(event.target.value);
  volume.value = newVolume;
  
  if (props.mediaType === 'video') {
    if (props.mediaProvider === 'vimeo' && playerRef.value) {
      if (window.Vimeo && Vimeo.Player) {
        try {
          const player = new Vimeo.Player(playerRef.value);
          player.setVolume(volume.value).then(() => {
            // Update muted state based on volume
            if (volume.value === 0) {
              isMuted.value = true;
            } else {
              isMuted.value = false;
            }
          }).catch(error => {
            console.error('Error setting Vimeo volume:', error);
          });
        } catch (error) {
          console.error('Error creating Vimeo player:', error);
        }
      } else {
        // Fallback to postMessage for volume control
        try {
          playerRef.value.contentWindow.postMessage({
            method: 'setVolume',
            value: volume.value
          }, '*');
          
          // Update muted state based on volume
          isMuted.value = volume.value === 0;
        } catch (e) {
          console.error('Error sending volume message to Vimeo:', e);
        }
      }
    } else if (props.mediaProvider === 'youtube') {
      // YouTube volume control via postMessage
      try {
        const iframe = playerRef.value;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            '{"event":"command","func":"setVolume","args":[' + (volume.value * 100) + ']}',
            '*'
          );
          
          // Update muted state based on volume
          if (volume.value === 0) {
            isMuted.value = true;
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"mute","args":""}',
              '*'
            );
          } else if (isMuted.value) {
            isMuted.value = false;
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"unMute","args":""}',
              '*'
            );
          }
        }
      } catch (e) {
        console.error('Error setting YouTube volume:', e);
      }
    } else if (playerRef.value) {
      // Native HTML5 video player
      playerRef.value.volume = volume.value;
      // Update muted state based on volume
      if (volume.value === 0) {
        isMuted.value = true;
        playerRef.value.muted = true;
      } else if (isMuted.value) {
        isMuted.value = false;
        playerRef.value.muted = false;
      }
    }
  } else if (props.mediaType === 'audio' && playerRef.value) {
    // Native HTML5 audio player
    playerRef.value.volume = volume.value;
    // Update muted state based on volume
    if (volume.value === 0) {
      isMuted.value = true;
      playerRef.value.muted = true;
    } else if (isMuted.value) {
      isMuted.value = false;
      playerRef.value.muted = false;
    }
  }
}

function handleMouseMove() {
  showControls.value = true;
  
  // Clear existing timer
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value);
  }
  
  // Start new timer to hide controls
  controlsTimer.value = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false;
    }
  }, 3000);
}

function handleKeyDown(event) {
  // Handle keyboard shortcuts
  if (event.key === 'Escape') {
    close();
  } else if (event.key === ' ' || event.key === 'k') {
    togglePlay();
    event.preventDefault();
  } else if (event.key === 'f') {
    toggleFullscreen();
    event.preventDefault();
  } else if (event.key === 'm') {
    toggleMute();
    event.preventDefault();
  }
}

// Extract video ID functions
function extractVimeoId(url) {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  return match ? match[1] : null;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Watching for document fullscreen changes
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

// Lifecycle hooks
onMounted(() => {
  // Check if URL should have presentation parameter
  if (!window.location.search.includes('presentation=true')) {
    // Add presentation parameter to URL
    const url = new URL(window.location.href);
    url.searchParams.set('presentation', 'true');
    window.history.replaceState({}, '', url.toString());
  }
  
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown);
  
  // Add fullscreen change listener
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Set up event listeners for iframe messages
  handlePostMessageEvents();
  
  // Load Vimeo API if needed
  if (props.mediaType === 'video' && props.mediaProvider === 'vimeo') {
    loadVimeoApi();
    
    // Initialize volume after iframe is loaded
    initializeVimeoVolume();
    
    // Check if casting is available
    checkCastingAvailability();
    
    // Start monitoring playback state after a short delay 
    // to allow the iframe to fully load
    setTimeout(() => {
      monitorPlaybackState();
    }, 1000);
  }
  
  // Load YouTube API if needed
  if (props.mediaType === 'video' && props.mediaProvider === 'youtube') {
    loadYouTubeApi();
  }
  
  // Initialize player if it exists
  if (playerRef.value && (props.mediaType === 'video' || props.mediaType === 'audio') && !props.mediaProvider) {
    // Only initialize direct access for native HTML5 players
    playerRef.value.volume = volume.value;
    playerRef.value.muted = isMuted.value;
    
    if (props.presentation.autoplay) {
      playerRef.value.play().catch(() => {
        // Autoplay was prevented
        isPlaying.value = false;
      });
    }
    
    // Add event listeners for native HTML5 players
    playerRef.value.addEventListener('play', () => { isPlaying.value = true; });
    playerRef.value.addEventListener('pause', () => { isPlaying.value = false; });
    playerRef.value.addEventListener('ended', () => { isPlaying.value = false; });
  }
  
  // Start time tracking for progress bar
  startTimeTracking();
  
  // Start controls timer
  handleMouseMove();
});

// Load Vimeo Player API
function loadVimeoApi() {
  if (window.Vimeo) return;
  
  const script = document.createElement('script');
  script.src = 'https://player.vimeo.com/api/player.js';
  script.async = true;
  document.body.appendChild(script);
}

// Load YouTube IFrame API
function loadYouTubeApi() {
  if (window.YT) return;
  
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  document.body.appendChild(script);
}

onBeforeUnmount(() => {
  // Remove event listeners
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Clear timers
  if (controlsTimer.value) {
    clearTimeout(controlsTimer.value);
  }
  
  // Clear time tracking intervals
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value);
  }
  
  // Clear monitor interval
  if (monitorIntervalId.value) {
    clearInterval(monitorIntervalId.value);
  }
  
  // Clean up any iframe related event listeners
  try {
    if (playerRef.value && props.mediaType === 'video' && !props.mediaProvider && playerRef.value.removeEventListener) {
      playerRef.value.removeEventListener('play', () => { isPlaying.value = true; });
      playerRef.value.removeEventListener('pause', () => { isPlaying.value = false; });
      playerRef.value.removeEventListener('ended', () => { isPlaying.value = false; });
      playerRef.value.removeEventListener('timeupdate', () => {});
    }
  } catch (e) {
    // Ignore errors in cleanup
  }
});

// Handle post message events from iframes
function handlePostMessageEvents() {
  window.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      // Handle Vimeo player events
      if (data.event && data.player_id) {
        if (data.event === 'play') {
          isPlaying.value = true;
        } else if (data.event === 'pause') {
          isPlaying.value = false;
        } else if (data.event === 'ended') {
          isPlaying.value = false;
        }
      }
      
      // Handle YouTube player events
      if (data.event === 'onStateChange' && typeof data.info === 'number') {
        if (data.info === 1) { // YT.PlayerState.PLAYING
          isPlaying.value = true;
        } else if (data.info === 2 || data.info === 0) { // YT.PlayerState.PAUSED or YT.PlayerState.ENDED
          isPlaying.value = false;
        }
      }
    } catch (e) {
      // Ignore errors parsing non-JSON messages
    }
  });
}

// Initialize the volume for Vimeo player
function initializeVimeoVolume() {
  if (!playerRef.value || props.mediaProvider !== 'vimeo') return;
  
  // Defer to ensure iframe is fully loaded
  setTimeout(() => {
    if (window.Vimeo && Vimeo.Player) {
      try {
        const player = new Vimeo.Player(playerRef.value);
        
        // Force set initial volume
        player.setVolume(volume.value).then(() => {
          // Also ensure not muted
          player.getMuted().then(muted => {
            if (muted) {
              player.setMuted(false);
              isMuted.value = false;
            }
          });
        }).catch(error => {
          console.error('Error setting initial Vimeo volume:', error);
          // Try postMessage fallback
          try {
            playerRef.value.contentWindow.postMessage({
              method: 'setVolume',
              value: volume.value
            }, '*');
            
            playerRef.value.contentWindow.postMessage({
              method: 'setMuted',
              value: false
            }, '*');
          } catch (e) {
            console.error('Error sending initial volume message to Vimeo:', e);
          }
        });
      } catch (error) {
        console.error('Error creating Vimeo player for volume initialization:', error);
      }
    }
  }, 1500); // Wait longer to ensure iframe is ready
}

// Attempt to check playing status via the iframe API
function monitorPlaybackState() {
  if (!playerRef.value) return;
  
  // Set up periodic check for Vimeo playback
  if (props.mediaType === 'video' && props.mediaProvider === 'vimeo') {
    const checkVimeoState = () => {
      if (window.Vimeo && Vimeo.Player && playerRef.value) {
        try {
          const player = new Vimeo.Player(playerRef.value);
          player.getPaused().then(paused => {
            isPlaying.value = !paused;
          }).catch(e => {
            // Ignore errors, will try again
          });
        } catch (e) {
          // Ignore errors, will try again
        }
      }
    };
    
    // Check every 2 seconds as a fallback method
    const interval = setInterval(checkVimeoState, 2000);
    
    // Store interval ID for cleanup
    monitorIntervalId.value = interval;
  }
}

// Direct methods to control vimeo player with postMessage fallbacks
function directVimeoPlay() {
  if (!playerRef.value) return;
  
  const iframe = playerRef.value;
  
  // Try to use Vimeo Player API
  if (window.Vimeo && Vimeo.Player) {
    try {
      const player = new Vimeo.Player(iframe);
      player.play().then(() => {
        isPlaying.value = true;
      }).catch(error => {
        // Fallback to postMessage
        directPostMessageToVimeo('play');
      });
    } catch (error) {
      // Fallback to postMessage
      directPostMessageToVimeo('play');
    }
  } else {
    // Fallback to postMessage
    directPostMessageToVimeo('play');
  }
}

function directVimeoPause() {
  if (!playerRef.value) return;
  
  const iframe = playerRef.value;
  
  // Try to use Vimeo Player API
  if (window.Vimeo && Vimeo.Player) {
    try {
      const player = new Vimeo.Player(iframe);
      player.pause().then(() => {
        isPlaying.value = false;
      }).catch(error => {
        // Fallback to postMessage
        directPostMessageToVimeo('pause');
      });
    } catch (error) {
      // Fallback to postMessage
      directPostMessageToVimeo('pause');
    }
  } else {
    // Fallback to postMessage
    directPostMessageToVimeo('pause');
  }
}

function directPostMessageToVimeo(action) {
  const iframe = playerRef.value;
  if (!iframe || !iframe.contentWindow) return;
  
  // Try different message formats that Vimeo might understand
  try {
    // Format 1: Standard Vimeo format
    iframe.contentWindow.postMessage({
      method: action
    }, '*');
    
    // Format 2: Alternative format used by some Vimeo embeds
    iframe.contentWindow.postMessage(
      '{"method":"' + action + '"}', 
      '*'
    );
    
    // Update local state
    isPlaying.value = action === 'play';
  } catch (e) {
    console.error('Error sending postMessage to Vimeo:', e);
  }
}

// Watch for changes to playing state from embedded players
watch(isPlaying, (newValue) => {
  if (newValue) {
    // If playing, start hiding controls timer
    handleMouseMove();
  } else {
    // If paused, always show controls
    showControls.value = true;
    if (controlsTimer.value) {
      clearTimeout(controlsTimer.value);
    }
  }
});
</script>

<template>
  <div 
    v-if="isActive" 
    ref="containerRef"
    class="presentation-viewer" 
    @mousemove="handleMouseMove"
    :class="{ 'controls-hidden': !showControls }"
  >
    <!-- Background layer -->
    <div class="background-layer" :style="backgroundStyle"></div>
    
    <!-- Content layer -->
    <div class="content-layer">
      <!-- Video content -->
      <div v-if="mediaType === 'video'" class="video-container">
        <!-- Vimeo embed -->
        <iframe 
          v-if="props.mediaProvider === 'vimeo'"
          ref="playerRef"
          :src="`https://player.vimeo.com/video/${extractVimeoId(props.mediaUrl)}?autoplay=${props.presentation.autoplay ? 1 : 0}&loop=${props.presentation.loop ? 1 : 0}&title=0&byline=0&portrait=0&background=1&api=1&muted=0`"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
        
        <!-- YouTube embed -->
        <iframe 
          v-else-if="mediaProvider === 'youtube'"
          ref="playerRef"
          :src="`https://www.youtube.com/embed/${extractYouTubeId(mediaUrl)}?autoplay=${presentation.autoplay ? 1 : 0}&loop=${presentation.loop ? 1 : 0}&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
        
        <!-- Native video player -->
        <video 
          v-else
          ref="playerRef"
          :src="mediaUrl"
          :poster="thumbnailUrl"
          :autoplay="presentation.autoplay"
          :loop="presentation.loop"
          :controls="false"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
        ></video>
      </div>
      
      <!-- Image content -->
      <div v-else-if="mediaType === 'image'" class="image-container">
        <img :src="mediaUrl" :alt="title" />
      </div>
      
      <!-- Audio content -->
      <div v-else-if="mediaType === 'audio'" class="audio-container">
        <audio 
          ref="playerRef"
          :src="mediaUrl"
          :autoplay="presentation.autoplay"
          :loop="presentation.loop"
          :controls="false"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
        ></audio>
        
        <!-- Audio visualization placeholder -->
        <div class="audio-visualization">
          <div class="audio-wave"></div>
        </div>
      </div>
    </div>
    
    <!-- Controls layer -->
    <div class="controls-layer" :class="{ 'visible': showControls }">
      <!-- Top bar with title and close button -->
      <div class="top-controls">
        <h2 class="media-title">{{ title }}</h2>
        <button class="close-button" @click="close" aria-label="Exit presentation mode">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <!-- Bottom controls for playback -->
      <div v-if="mediaType === 'video' || mediaType === 'audio'" class="bottom-controls">
        <!-- Progress/scrubber bar -->
        <div class="progress-bar-container" @click="seekToPosition">
          <div class="progress-bar-background"></div>
          <div class="progress-bar-loaded" :style="{ width: loadedProgress + '%' }"></div>
          <div class="progress-bar-played" :style="{ width: playedProgress + '%' }"></div>
          <div class="progress-handle" :style="{ left: playedProgress + '%' }" v-show="showControls"></div>
        </div>
        
        <!-- Time display -->
        <div class="time-display">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="time-separator">/</span>
          <span class="total-time">{{ formatTime(duration) }}</span>
        </div>
        
        <div class="playback-controls">
          <!-- Play/Pause button -->
          <button class="play-button" @click="togglePlay" :aria-label="isPlaying ? 'Pause' : 'Play'">
            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          
          <!-- Volume control -->
          <div class="volume-control">
            <button class="mute-button" @click="toggleMute" :aria-label="isMuted ? 'Unmute' : 'Mute'">
              <svg v-if="isMuted || volume === 0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <svg v-else-if="volume < 0.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              :value="volume" 
              @input="setVolume" 
              class="volume-slider"
              aria-label="Volume"
            />
          </div>
        </div>
        
        <div class="secondary-controls">
          <!-- Cast button (only for Vimeo when casting is available) -->
          <button 
            v-if="props.mediaProvider === 'vimeo' && castingAvailable"
            class="cast-button" 
            @click="toggleCast" 
            :aria-label="isCasting ? 'Stop casting' : 'Cast to TV'"
            :class="{ 'is-casting': isCasting }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
              <line x1="2" y1="20" x2="2.01" y2="20"></line>
            </svg>
          </button>
          
          <!-- Fullscreen toggle -->
          <button class="fullscreen-button" @click="toggleFullscreen" :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'">
            <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Technical details button (to be expanded in Phase 2) -->
      <button v-if="technicalDetails.tools?.length || technicalDetails.format || technicalDetails.duration" class="technical-details-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.presentation-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.content-layer {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container, .audio-container, .image-container {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-container {
  aspect-ratio: 16 / 9;
  width: 90%;
  max-width: 1600px;
}

.video-container iframe,
.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
}

.image-container img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

.audio-container {
  width: 80%;
  max-width: 800px;
  height: 200px;
  background-color: rgba(20, 20, 20, 0.5);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.audio-visualization {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.audio-wave {
  width: 80%;
  height: 80px;
  background: linear-gradient(90deg, var(--vp-c-brand) 0%, var(--vp-c-brand-light) 100%);
  border-radius: var(--radius-sm);
  opacity: 0.5;
}

/* Controls styling */
.controls-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.controls-layer.visible {
  opacity: 1;
}

.top-controls, .bottom-controls {
  pointer-events: auto;
  display: flex;
  align-items: center;
  padding: var(--space-5);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
}

.bottom-controls {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
  justify-content: space-between;
  flex-direction: column;
  width: 100%;
  padding-top: var(--space-8);
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
  position: relative;
  cursor: pointer;
  transition: height 0.2s ease;
  margin-bottom: var(--space-3);
}

.progress-bar-container:hover {
  height: 8px;
}

.progress-bar-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-sm);
}

.progress-bar-loaded {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  transition: width 0.2s ease;
}

.progress-bar-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--vp-c-brand, #3eaf7c);
  border-radius: var(--radius-sm);
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--vp-c-brand, #3eaf7c);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease, width 0.2s ease, height 0.2s ease;
}

.progress-bar-container:hover .progress-handle {
  opacity: 1;
  width: 14px;
  height: 14px;
}

.time-display {
  font-size: var(--text-sm);
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-3);
  align-self: flex-start;
  margin-left: var(--space-3);
}

.time-separator {
  margin: 0 var(--space-1);
  opacity: 0.7;
}

.top-controls {
  justify-content: space-between;
}

.media-title {
  color: white;
  font-size: var(--text-xl);
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  margin: 0;
  padding: var(--space-2);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

button:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.play-button {
  width: 48px;
  height: 48px;
  background-color: rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.play-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.play-button:active {
  transform: scale(0.95);
}

.close-button, .fullscreen-button, .mute-button, .cast-button {
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.close-button:hover, .fullscreen-button:hover, .mute-button:hover, .cast-button:hover {
  background-color: rgba(0, 0, 0, 0.6);
}

.cast-button.is-casting {
  color: var(--vp-c-brand);
  background-color: rgba(0, 0, 0, 0.5);
}

.secondary-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playback-controls, .volume-control {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: var(--space-3);
  margin-bottom: var(--space-3);
}

.secondary-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  position: absolute;
  right: var(--space-5);
  bottom: var(--space-5);
}

.volume-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.volume-slider:hover {
  height: 6px;
  background: rgba(255, 255, 255, 0.5);
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  width: 14px;
  height: 14px;
  background: #ffffff;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.volume-slider::-moz-range-thumb:hover {
  width: 14px;
  height: 14px;
  background: #ffffff;
}

.volume-slider::-ms-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.volume-slider::-ms-thumb:hover {
  width: 14px;
  height: 14px;
  background: #ffffff;
}

.technical-details-button {
  position: absolute;
  top: var(--space-5);
  right: 70px;
  color: white;
}

/* Media queries for responsive layout */
@media (max-width: 768px) {
  .video-container {
    width: 100%;
  }
  
  .media-title {
    font-size: var(--text-base);
    max-width: 70%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .top-controls, .bottom-controls {
    padding: var(--space-3);
  }
  
  .bottom-controls {
    padding-top: var(--space-5);
  }
  
  .progress-bar-container {
    height: 4px;
    margin-bottom: var(--space-2);
  }
  
  .progress-handle {
    width: var(--space-3);
    height: var(--space-3);
  }
  
  .progress-bar-container:hover .progress-handle {
    width: var(--space-3);
    height: var(--space-3);
  }
  
  .time-display {
    font-size: var(--text-xs);
    margin-bottom: var(--space-2);
  }
  
  .close-button, .fullscreen-button, .mute-button, .cast-button {
    width: 36px;
    height: 36px;
  }
  
  .play-button {
    width: 40px;
    height: 40px;
  }
  
  .volume-slider {
    width: 60px;
  }
  
  .technical-details-button {
    right: 60px;
  }
  
  .secondary-controls {
    right: var(--space-3);
    bottom: 15px;
  }
}
</style>