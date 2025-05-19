#!/bin/bash
# Script to update all workbook items to use the new WorkbookViewer component

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKBOOK_DIR="$DIR/docs/workbook"

# Loop through all Markdown files in the workbook directory (excluding index.md)
for file in "$WORKBOOK_DIR"/*.md; do
  if [ "$(basename "$file")" != "index.md" ] && [ "$(basename "$file")" != "obsidian-heart.md" ] && [ "$(basename "$file")" != "the-place-where-gods-are-born.md" ]; then
    echo "Processing $file..."
    
    # Replace layout: workbookitem with sidebar: false
    sed -i '' 's/layout: workbookitem/sidebar: false/g' "$file"
    
    # Find the end of frontmatter (the second ---)
    frontmatter_end=$(grep -n "^---" "$file" | awk 'NR==2 {print $1}' | cut -d: -f1)
    
    # Insert the WorkbookViewer component after the frontmatter
    if [ ! -z "$frontmatter_end" ]; then
      # Create a temporary file
      temp_file=$(mktemp)
      
      # Copy the frontmatter to the temp file
      head -n "$frontmatter_end" "$file" > "$temp_file"
      
      # Add the WorkbookViewer component
      echo "" >> "$temp_file"
      echo "<ClientOnly>" >> "$temp_file"
      echo "  <WorkbookViewer />" >> "$temp_file"
      echo "</ClientOnly>" >> "$temp_file"
      echo "" >> "$temp_file"
      
      # Copy the rest of the file
      tail -n +$((frontmatter_end + 1)) "$file" >> "$temp_file"
      
      # Add the import script at the end of the file
      echo "" >> "$temp_file"
      echo "<script setup>" >> "$temp_file"
      echo "import WorkbookViewer from '../.vitepress/theme/components/workbook/WorkbookViewer.vue';" >> "$temp_file"
      echo "</script>" >> "$temp_file"
      
      # Replace the original file
      mv "$temp_file" "$file"
    else
      echo "Could not find frontmatter end in $file"
    fi
  fi
done

echo "All workbook items updated!"
