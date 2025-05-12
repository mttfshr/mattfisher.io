import DefaultTheme from 'vitepress/theme'
import Layout from './layouts/Layout.vue'
import NoteLayout from './layouts/NoteLayout.vue'
import WorkbookItemLayout from './layouts/WorkbookItemLayout.vue'
import PinsLayout from './layouts/PinsLayout.vue'
import '@fontsource-variable/source-sans-3';
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './style.css'
import './styles/pins.css'

// Import custom components
import EnhancedMarkdown from './components/common/EnhancedMarkdown.vue'
import EnhancedNote from './components/notes/EnhancedNote.vue'
import MediaEmbed from './components/common/MediaEmbed.vue'
import LogUpdate from './components/log/LogUpdate.vue'
import LogPin from './components/log/LogPin.vue'
import LogFeed from './components/log/LogFeed.vue'
import NoteCard from './components/notes/NoteCard.vue'
import NotesIndex from './components/notes/NotesIndex.vue'
import WorkbookItem from './components/workbook/WorkbookItem.vue'
import WorkbookGallery from './components/workbook/WorkbookGallery.vue'

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
    app.component('NoteCard', NoteCard)
    app.component('NotesIndex', NotesIndex)
    app.component('PinsLayout', PinsLayout)
    app.component('WorkbookItem', WorkbookItem)
    app.component('WorkbookGallery', WorkbookGallery)
  },
  // Custom layouts for frontmatter-specified layouts
  noteLayout: NoteLayout,
  workbookItemLayout: WorkbookItemLayout
}