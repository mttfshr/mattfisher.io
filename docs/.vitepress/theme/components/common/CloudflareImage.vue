<template>
  <img 
    :src="imageUrl" 
    :alt="alt" 
    :width="width" 
    :height="height"
    :loading="loading"
    class="cloudflare-image"
    @error="handleImageError"
  />
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  imageId: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  loading: {
    type: String,
    default: 'lazy'
  },
  variant: {
    type: String,
    default: 'public'
  }
});

const imageError = ref(false);

// Cloudflare Images URL construction
// You'll need to set VITE_CLOUDFLARE_IMAGES_HASH in your environment
const CLOUDFLARE_HASH = import.meta.env.VITE_CLOUDFLARE_IMAGES_HASH;

const imageUrl = computed(() => {
  if (imageError.value) {
    return '/placeholder-image.jpg'; // Fallback image
  }
  
  if (!CLOUDFLARE_HASH) {
    console.warn('VITE_CLOUDFLARE_IMAGES_HASH not configured');
    return '/placeholder-image.jpg';
  }
  
  return `https://imagedelivery.net/${CLOUDFLARE_HASH}/${props.imageId}/${props.variant}`;
});

function handleImageError() {
  console.warn(`Failed to load Cloudflare image: ${props.imageId}`);
  imageError.value = true;
}
</script>

<style scoped>
.cloudflare-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.cloudflare-image:hover {
  opacity: 0.9;
  transition: opacity 0.2s ease;
}
</style>
