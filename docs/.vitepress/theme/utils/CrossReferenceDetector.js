// docs/.vitepress/theme/utils/CrossReferenceDetector.js

/**
 * Natural Linking System - Detects cross-references between content
 * Integrates with existing semantic design system patterns
 */

/**
 * Detect cross-references between different content types
 * @param {Array} sourceItems - Items to search for links within
 * @param {Array} targetItems - Items to search for references to
 * @param {Object} options - Configuration options
 * @returns {Array} Array of detected cross-references
 */
export function detectCrossReferences(sourceItems, targetItems, options = {}) {
  const {
    threshold = 0.8, // Similarity threshold for fuzzy matching
    includePartialMatches = true,
    contentFields = ['content', 'description', 'summary'],
    titleFields = ['title', 'name']
  } = options;

  const crossReferences = [];

  sourceItems.forEach(sourceItem => {
    targetItems.forEach(targetItem => {
      // Skip self-references
      if (sourceItem.id === targetItem.id) return;

      const references = findReferencesInItem(sourceItem, targetItem, {
        threshold,
        includePartialMatches,
        contentFields,
        titleFields
      });

      if (references.length > 0) {
        crossReferences.push({
          sourceId: sourceItem.id,
          sourceType: sourceItem.type || 'unknown',
          sourceTitle: getItemTitle(sourceItem, titleFields),
          targetId: targetItem.id,
          targetType: targetItem.type || 'unknown',
          targetTitle: getItemTitle(targetItem, titleFields),
          references,
          strength: calculateReferenceStrength(references),
          bidirectional: checkBidirectional(sourceItem, targetItem, options)
        });
      }
    });
  });

  return crossReferences.sort((a, b) => b.strength - a.strength);
}

/**
 * Find specific references within an item
 */
function findReferencesInItem(sourceItem, targetItem, options) {
  const references = [];
  const targetTitle = getItemTitle(targetItem, options.titleFields);
  
  // Check title references
  const titleReferences = findTitleReferences(sourceItem, targetTitle, options);
  references.push(...titleReferences);

  // Check content references
  const contentReferences = findContentReferences(sourceItem, targetItem, options);
  references.push(...contentReferences);

  // Check tag/keyword references
  const tagReferences = findTagReferences(sourceItem, targetItem);
  references.push(...tagReferences);

  return references;
}

/**
 * Find direct title mentions
 */
function findTitleReferences(sourceItem, targetTitle, options) {
  const references = [];
  const searchableContent = getSearchableContent(sourceItem, options.contentFields);
  
  // Exact title matches
  const exactMatches = findExactMatches(searchableContent, targetTitle);
  references.push(...exactMatches.map(match => ({
    type: 'title_exact',
    confidence: 1.0,
    context: match.context,
    position: match.position
  })));

  // Fuzzy title matches (if enabled)
  if (options.includePartialMatches) {
    const fuzzyMatches = findFuzzyMatches(searchableContent, targetTitle, options.threshold);
    references.push(...fuzzyMatches.map(match => ({
      type: 'title_fuzzy',
      confidence: match.similarity,
      context: match.context,
      position: match.position
    })));
  }

  return references;
}

/**
 * Find content-based references (shared concepts, topics)
 */
function findContentReferences(sourceItem, targetItem, options) {
  const references = [];
  const sourceContent = getSearchableContent(sourceItem, options.contentFields);
  const targetContent = getSearchableContent(targetItem, options.contentFields);

  // Extract key phrases and concepts
  const sourceKeyPhrases = extractKeyPhrases(sourceContent);
  const targetKeyPhrases = extractKeyPhrases(targetContent);

  // Find overlapping phrases
  const overlappingPhrases = findOverlappingPhrases(sourceKeyPhrases, targetKeyPhrases);
  
  if (overlappingPhrases.length > 0) {
    references.push({
      type: 'content_conceptual',
      confidence: Math.min(overlappingPhrases.length * 0.2, 0.9),
      sharedConcepts: overlappingPhrases,
      count: overlappingPhrases.length
    });
  }

  return references;
}

/**
 * Find tag-based references
 */
function findTagReferences(sourceItem, targetItem) {
  const references = [];
  const sourceTags = getTags(sourceItem);
  const targetTags = getTags(targetItem);

  if (sourceTags.length === 0 || targetTags.length === 0) {
    return references;
  }

  const commonTags = sourceTags.filter(tag => 
    targetTags.some(targetTag => 
      normalizeTag(tag) === normalizeTag(targetTag)
    )
  );

  if (commonTags.length > 0) {
    references.push({
      type: 'tag_match',
      confidence: Math.min(commonTags.length * 0.3, 0.8),
      commonTags,
      count: commonTags.length
    });
  }

  return references;
}

/**
 * Utility functions
 */

function getItemTitle(item, titleFields) {
  for (const field of titleFields) {
    if (item[field]) return item[field];
  }
  return 'Untitled';
}

function getSearchableContent(item, contentFields) {
  const content = [];
  for (const field of contentFields) {
    if (item[field]) {
      content.push(item[field]);
    }
  }
  return content.join(' ').toLowerCase();
}

function getTags(item) {
  const tags = item.tags || item.categories || item.keywords || [];
  return Array.isArray(tags) ? tags : [];
}

function normalizeTag(tag) {
  return tag.toLowerCase().trim().replace(/[\s-_]+/g, '-');
}

function findExactMatches(content, searchTerm) {
  const matches = [];
  const regex = new RegExp(`\\b${escapeRegex(searchTerm.toLowerCase())}\\b`, 'gi');
  let match;

  while ((match = regex.exec(content)) !== null) {
    matches.push({
      position: match.index,
      context: extractContext(content, match.index, searchTerm.length)
    });
  }

  return matches;
}

function findFuzzyMatches(content, searchTerm, threshold) {
  // Simplified fuzzy matching - could be enhanced with libraries like fuse.js
  const words = content.split(/\s+/);
  const matches = [];

  words.forEach((word, index) => {
    const similarity = calculateSimilarity(word, searchTerm.toLowerCase());
    if (similarity >= threshold) {
      matches.push({
        similarity,
        position: content.indexOf(word),
        context: extractContext(content, content.indexOf(word), word.length)
      });
    }
  });

  return matches;
}

function extractKeyPhrases(content) {
  // Simplified key phrase extraction
  // In production, could use NLP libraries
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const phrases = [];
  
  // Extract 2-3 word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  return [...new Set(phrases)]; // Remove duplicates
}

function findOverlappingPhrases(phrases1, phrases2) {
  return phrases1.filter(phrase => phrases2.includes(phrase));
}

function extractContext(content, position, length) {
  const start = Math.max(0, position - 50);
  const end = Math.min(content.length, position + length + 50);
  return content.substring(start, end);
}

function calculateSimilarity(str1, str2) {
  // Simplified Levenshtein distance calculation
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - (distance / maxLength);
}

function calculateReferenceStrength(references) {
  if (references.length === 0) return 0;
  
  const totalConfidence = references.reduce((sum, ref) => sum + ref.confidence, 0);
  const avgConfidence = totalConfidence / references.length;
  
  // Boost strength for multiple reference types
  const typeBonus = Math.min(references.length * 0.1, 0.3);
  
  return Math.min(avgConfidence + typeBonus, 1.0);
}

function checkBidirectional(item1, item2, options) {
  const reverseRefs = findReferencesInItem(item2, item1, options);
  return reverseRefs.length > 0;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate linking suggestions for UI
 */
export function generateLinkingSuggestions(crossReferences, options = {}) {
  const { maxSuggestions = 5, minStrength = 0.3 } = options;

  return crossReferences
    .filter(ref => ref.strength >= minStrength)
    .slice(0, maxSuggestions)
    .map(ref => ({
      ...ref,
      suggestion: generateLinkText(ref),
      actionType: ref.bidirectional ? 'bidirectional_link' : 'reference_link'
    }));
}

function generateLinkText(crossReference) {
  const { targetTitle, references, strength } = crossReference;
  
  if (references.some(ref => ref.type === 'title_exact')) {
    return `Related to "${targetTitle}"`;
  } else if (references.some(ref => ref.type === 'tag_match')) {
    const tagRef = references.find(ref => ref.type === 'tag_match');
    return `Shares topics: ${tagRef.commonTags.slice(0, 3).join(', ')}`;
  } else {
    return `Connected to "${targetTitle}" (${Math.round(strength * 100)}% match)`;
  }
}
