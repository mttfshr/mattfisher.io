// docs/.vitepress/theme/composables/usePinsData.js
import { computed } from 'vue';
import { useData } from 'vitepress';

export function usePinsData() {
  const { theme } = useData();
  
  // Access pins data from theme
  const pinsData = computed(() => theme.value.pins || {
    pins: [],
    contentTypes: [],
    allTags: [],
    userTags: [],
    sections: []
  });
  
  const pins = computed(() => pinsData.value.pins || []);
  const contentTypes = computed(() => pinsData.value.contentTypes || []);
  const allTags = computed(() => pinsData.value.allTags || []);
  const userTags = computed(() => pinsData.value.userTags || []);
  const sections = computed(() => pinsData.value.sections || []);
  
  // Function to filter pins by tag
  const filterByTag = (tag) => {
    return pins.value.filter(pin => pin.tags.includes(tag));
  };
  
  // Function to filter pins by content type
  const filterByContentType = (type) => {
    return pins.value.filter(pin => pin.contentType === type);
  };
  
  // Function to filter pins by section
  const filterBySection = (section) => {
    return pins.value.filter(pin => pin.section === section);
  };
  
  // Get uncategorized pins (only has auto-generated content type tag)
  const uncategorizedPins = computed(() => {
    return pins.value.filter(pin => {
      return pin.tags.length === 1 && contentTypes.value.includes(pin.tags[0]);
    });
  });
  
  // Get pins by domain
  const getPinsByDomain = () => {
    const domains = {};
    
    pins.value.forEach(pin => {
      try {
        const domain = new URL(pin.url).hostname.replace('www.', '');
        if (!domains[domain]) {
          domains[domain] = [];
        }
        domains[domain].push(pin);
      } catch (error) {
        if (!domains['other']) {
          domains['other'] = [];
        }
        domains['other'].push(pin);
      }
    });
    
    return domains;
  };
  
  // Get related pins
  const getRelatedPins = (pin, limit = 6) => {
    if (!pin) return [];
    
    // First, try to find pins with the same tags
    const sameTags = pins.value.filter(p => 
      p.id !== pin.id &&
      p.tags.some(tag => pin.tags.includes(tag))
    );
    
    // If we don't have enough, add pins with the same content type
    if (sameTags.length < limit) {
      const sameType = pins.value.filter(p => 
        p.id !== pin.id &&
        p.contentType === pin.contentType &&
        !sameTags.includes(p)
      );
      
      return [...sameTags, ...sameType].slice(0, limit);
    }
    
    return sameTags.slice(0, limit);
  };
  
  return {
    pins,
    contentTypes,
    allTags,
    userTags,
    sections,
    filterByTag,
    filterByContentType,
    filterBySection,
    uncategorizedPins,
    getPinsByDomain,
    getRelatedPins
  };
}