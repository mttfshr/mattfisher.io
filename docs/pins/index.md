---
layout: home
---

<script setup>
import PinCollections from '../.vitepress/theme/components/pins/PinCollections.vue'
import { useData } from 'vitepress'

// Verify data is available in theme
const { theme } = useData()
</script>

# Pins

<div class="pin-intro">
  <p>Collection of interesting links, organized by category and tag. <code>#hashtags</code> are extracted from pin descriptions.</p>
</div>

<!-- Force full width wrapper to work around any VitePress limitations -->
<div class="vp-full-width-wrapper" style="width:100%; max-width:100%; margin:0; padding:0;">
  <div class="pins-container full-width">
    <PinCollections />
  </div>
</div>

<style>
/* Reset VitePress styling for the pins page */
:root {
  --vp-layout-max-width: 100% !important;
}

.VPDoc.has-aside .content-container {
  max-width: 100% !important;
}

.VPContent.is-home,
.VPDoc {
  padding-bottom: 32px !important;
}

.pin-intro {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.pin-intro p {
  margin: 0;
}

.pin-intro code {
  background-color: var(--vp-c-bg-alt);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

/* Full width styles */
.vp-full-width-wrapper,
.full-width {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.pins-container .pin-collections {
  max-width: 100% !important;
  width: 100% !important;
  padding: 0 !important;
}

/* Adjust grid to show more items per row */
.pins-container .pin-grid.grid .pins-container {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
}

/* Adjust masonry to show more columns */
@media (min-width: 1600px) {
  .pins-container .pin-grid.masonry .pins-container {
    column-count: 5 !important;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .pins-container .pin-grid.masonry .pins-container {
    column-count: 4 !important;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .pins-container .pin-grid.masonry .pins-container {
    column-count: 3 !important;
  }
}
</style>