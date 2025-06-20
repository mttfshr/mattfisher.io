---
title: Mobile Orientation Test
layout: doc
---

# Mobile Orientation Test

<div class="orientation-test">
  <h2>Current Orientation Info</h2>
  <div id="orientation-info">
    <p><strong>Screen dimensions:</strong> <span id="screen-size"></span></p>
    <p><strong>Window dimensions:</strong> <span id="window-size"></span></p>
    <p><strong>Orientation:</strong> <span id="orientation"></span></p>
    <p><strong>Screen orientation:</strong> <span id="screen-orientation"></span></p>
    <p><strong>Device pixel ratio:</strong> <span id="pixel-ratio"></span></p>
  </div>
  
  <h2>Instructions</h2>
  <p>Try rotating your device. The information above should update automatically.</p>
  
  <h2>Test Video</h2>
  <div style="background: #000; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <div style="background: #333; color: white; padding: 20px; text-align: center; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
      <div>
        <h3>Test Video Area</h3>
        <p>This should be easier to view in landscape</p>
        <p>Try rotating your device!</p>
      </div>
    </div>
  </div>
</div>

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  function updateOrientationInfo() {
    document.getElementById('screen-size').textContent = `${screen.width} × ${screen.height}`;
    document.getElementById('window-size').textContent = `${window.innerWidth} × ${window.innerHeight}`;
    document.getElementById('orientation').textContent = window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape';
    document.getElementById('screen-orientation').textContent = screen.orientation ? screen.orientation.type : 'Unknown';
    document.getElementById('pixel-ratio').textContent = window.devicePixelRatio;
  }
  
  // Initial update
  updateOrientationInfo();
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(updateOrientationInfo, 100);
  });
  
  window.addEventListener('resize', updateOrientationInfo);
  
  if (screen.orientation) {
    screen.orientation.addEventListener('change', updateOrientationInfo);
  }
});
</script>

<style scoped>
.orientation-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

#orientation-info {
  background: rgba(0, 100, 200, 0.1);
  border: 1px solid rgba(0, 100, 200, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  font-family: monospace;
}

#orientation-info p {
  margin: 8px 0;
}

#orientation-info span {
  color: #0066cc;
  font-weight: bold;
}
</style>
