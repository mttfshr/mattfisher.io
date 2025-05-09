import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import '@fontsource-variable/source-sans-3';
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './style.css'

// Import custom components
import EnhancedMarkdown from './components/EnhancedMarkdown.vue'
import EnhancedNote from './components/EnhancedNote.vue'
import MediaEmbed from './components/MediaEmbed.vue'
import LogUpdate from './components/LogUpdate.vue'
import LogPin from './components/LogPin.vue'
import LogFeed from './components/LogFeed.vue'
import NotesCard from './components/NotesCard.vue'
import NotesGrid from './components/NotesGrid.vue'
import WorkbookItem from './components/WorkbookItem.vue'
import WorkbookGallery from './components/WorkbookGallery.vue'

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Register components globally
    app.component('EnhancedMarkdown', EnhancedMarkdown)
    app.component('EnhancedNote', EnhancedNote)
    app.component('MediaEmbed', MediaEmbed)
    app.component('LogUpdate', LogUpdate)
    app.component('LogPin', LogPin)
    app.component('LogFeed', LogFeed)
    app.component('NotesCard', NotesCard)
    app.component('NotesGrid', NotesGrid)
    app.component('WorkbookItem', WorkbookItem)
    app.component('WorkbookGallery', WorkbookGallery)
  }
}