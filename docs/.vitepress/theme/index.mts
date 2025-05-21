import DefaultTheme from 'vitepress/theme'
import Layout from './layouts/Layout.vue'
import NoteLayout from './layouts/NoteLayout.vue'
import WorkbookItemLayout from './layouts/WorkbookItemLayout.vue'
import PinsLayout from './layouts/PinsLayout.vue'
import MicroblogLayout from './layouts/MicroblogLayout.vue'
import FolderIndexLayout from './layouts/FolderIndexLayout.vue'
import WorkbookFolioLayout from './layouts/WorkbookFolioLayout.vue'
import DebugLayout from './layouts/DebugLayout.vue'
import CollectionLayout from './components/collections/CollectionLayout.vue'
import '@fontsource-variable/source-sans-3';
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './style.css'
import './styles/pins.css'
import './styles/workbook.css'

// Import custom components
import EnhancedMarkdown from './components/common/EnhancedMarkdown.vue'
import EnhancedNote from './components/notes/EnhancedNote.vue'
import MediaEmbed from './components/common/MediaEmbed.vue'
import AssetDiagnostics from './components/common/AssetDiagnostics.vue'
import LogUpdate from './components/log/LogUpdate.vue'
import LogFeed from './components/log/LogFeed.vue'
import NoteCard from './components/notes/NoteCard.vue'
import NotesIndex from './components/notes/NotesIndex.vue'
import WorkbookItem from './components/workbook/WorkbookItem.vue'
import WorkbookGallery from './components/workbook/WorkbookGallery.vue'
import WorkbookViewer from './components/workbook/WorkbookViewer.vue'
import WorkbookPage from './components/workbook/WorkbookPage.vue'
import PresentationViewer from './components/workbook/PresentationViewer.vue'
import MediaContainer from './components/workbook/MediaContainer.vue'
import PinsPage from './components/pins/PinsPage.vue'

// Import collection components
import CollectionsGallery from './components/collections/CollectionsGallery.vue'
import TagFilter from './components/collections/TagFilter.vue'
import TagVisualization from './components/collections/TagVisualization.vue'
import StructuredTagsDisplay from './components/collections/StructuredTagsDisplay.vue'

export default {
  extends: DefaultTheme,
  
  // Register custom layouts
  layouts: {
    layout: Layout,
    note: NoteLayout,
    workbookItem: WorkbookItemLayout,
    pins: PinsLayout,
    microblog: MicroblogLayout,
    folderindex: FolderIndexLayout,
    workbookfolio: WorkbookFolioLayout,
    debug: DebugLayout,
    // Add collection layout
    collection: CollectionLayout
  },
  
  enhanceApp({ app }) {
    // Register components globally
    app.component('EnhancedMarkdown', EnhancedMarkdown)
    app.component('EnhancedNote', EnhancedNote)
    app.component('MediaEmbed', MediaEmbed)
    app.component('LogUpdate', LogUpdate)
    app.component('LogFeed', LogFeed)
    app.component('NoteCard', NoteCard)
    app.component('NotesIndex', NotesIndex)
    app.component('WorkbookItem', WorkbookItem)
    app.component('WorkbookGallery', WorkbookGallery)
    app.component('WorkbookViewer', WorkbookViewer)
    app.component('PresentationViewer', PresentationViewer)
    app.component('MediaContainer', MediaContainer)
    app.component('AssetDiagnostics', AssetDiagnostics)
    app.component('PinsPage', PinsPage)
    app.component('Pins', PinsPage) // Also register as 'Pins' component
    app.component('WorkbookPage', WorkbookPage) // Register WorkbookPage component
    
    // Register collection components
    app.component('CollectionsGallery', CollectionsGallery)
    app.component('TagFilter', TagFilter)
    app.component('TagVisualization', TagVisualization)
    app.component('StructuredTagsDisplay', StructuredTagsDisplay)
  }
}