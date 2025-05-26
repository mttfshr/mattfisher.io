// services/content/collections.js
// Collection processing utilities

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { parseTags } from './metadata.js'

/**
 * Function to gather collections data at build time
 */
export function getCollections() {
  const collectionsDir = path.resolve(process.cwd(), 'docs/workbook/collections')
  
  // Create the collections directory if it doesn't exist
  if (!fs.existsSync(collectionsDir)) {
    console.log(`Creating collections directory: ${collectionsDir}`)
    fs.mkdirSync(collectionsDir, { recursive: true })
  }
  
  // Get all .md files in the collections directory except index.md
  const files = fs.existsSync(collectionsDir) 
    ? fs.readdirSync(collectionsDir).filter(file => 
        file.endsWith('.md') && file !== 'index.md'
      )
    : []
  
  console.log('Collection files found:', files);
  
  // Parse each collection file
  const collections = files.map(file => {
    const filePath = path.join(collectionsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: description } = matter(content)
    const slug = file.replace(/\.md$/, '')
    
    // Get last modified time from file stats
    const stats = fs.statSync(filePath)
    const lastModified = stats.mtime.getTime()
    
    return {
      title: frontmatter.title || slug,
      slug,
      description: frontmatter.description || '',
      featured: frontmatter.featured || false,
      image: frontmatter.image || '',
      order: frontmatter.order || 999,
      tagQuery: frontmatter.tagQuery || null,
      groupBy: frontmatter.groupBy || null,
      sortBy: frontmatter.sortBy || 'year',
      sortDirection: frontmatter.sortDirection || 'desc',
      path: `/workbook/collections/${slug}`,
      content: description,
      lastUpdated: lastModified
    }
  })
  
  // Sort collections by order property
  return collections.sort((a, b) => a.order - b.order)
}

/**
 * Process collections to include their matching items
 */
export function processCollections(collections, workbookItems) {
  return collections.map(collection => {
    // If collection doesn't have a tag query, return as is
    if (!collection.tagQuery) {
      return collection;
    }
    
    // Find items matching the tag query
    const matchingItems = workbookItems.filter(item => {
      // Check if item has all required tags
      if (collection.tagQuery.includes) {
        const matches = collection.tagQuery.includes.every(tag => {
          return item.tags.includes(tag);
        });
        
        if (!matches) return false;
      }
      
      // Check if item has any excluded tags
      if (collection.tagQuery.excludes) {
        const hasExcluded = collection.tagQuery.excludes.some(tag => {
          return item.tags.includes(tag);
        });
        
        if (hasExcluded) return false;
      }
      
      return true;
    });
    
    // Sort the matching items based on collection settings
    const sortedItems = [...matchingItems].sort((a, b) => {
      const valueA = a[collection.sortBy] || '';
      const valueB = b[collection.sortBy] || '';
      
      // Handle numeric values
      if (!isNaN(valueA) && !isNaN(valueB)) {
        return collection.sortDirection === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
      
      // Handle string values
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      return collection.sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
    
    // Group items if groupBy is specified
    let groupedItems = null;
    if (collection.groupBy) {
      groupedItems = {};
      
      sortedItems.forEach(item => {
        // Get the parsed tags for this item
        const parsedItemTags = parseTags(item.tags);
        
        // Get grouping value based on tag category
        const groupValues = parsedItemTags[collection.groupBy] || [];
        
        // If no group value, add to "Other"
        if (groupValues.length === 0) {
          const otherGroup = groupedItems['Other'] || [];
          otherGroup.push(item);
          groupedItems['Other'] = otherGroup;
        } else {
          // Add to each group
          groupValues.forEach(groupValue => {
            const group = groupedItems[groupValue] || [];
            group.push(item);
            groupedItems[groupValue] = group;
          });
        }
      });
      
      // Sort the groups by key
      groupedItems = Object.fromEntries(
        Object.entries(groupedItems).sort((a, b) => {
          // Keep "Other" at the end
          if (a[0] === 'Other') return 1;
          if (b[0] === 'Other') return -1;
          return a[0].localeCompare(b[0]);
        })
      );
    }
    
    // Return the collection with matched items
    return {
      ...collection,
      items: sortedItems,
      groupedItems,
      totalItems: sortedItems.length
    };
  });
}
