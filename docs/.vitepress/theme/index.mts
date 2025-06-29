import DefaultTheme from 'vitepress/theme'
import Layout from './layouts/Layout.vue'
import NoteLayout from './layouts/NoteLayout.vue'
import WorkbookItemLayout from './layouts/WorkbookItemLayout.vue'
import FolderIndexLayout from './layouts/FolderIndexLayout.vue'

// IBM Plex Font Family - Complete Typography System
import '@fontsource/ibm-plex-sans/300.css'     // Light
import '@fontsource/ibm-plex-sans/400.css'     // Regular  
import '@fontsource/ibm-plex-mono/400.css'     // Regular
import '@fontsource/ibm-plex-mono/400-italic.css' // Regular Italic
import '@fontsource/ibm-plex-serif/300.css'    // Light
import '@fontsource/ibm-plex-serif/400.css'    // Regular
import '@fontsource/ibm-plex-serif/400-italic.css' // Regular Italic

// Main stylesheet - Clean architecture with Authentic Sans + IBM Plex
import './styles/main.css'
// Mobile orientation fix
import './scripts/mobile-orientation.js'

// Import custom components
import CloudflareImage from './components/common/CloudflareImage.vue'
import EnhancedMarkdown from './components/common/EnhancedMarkdown.vue'
import EnhancedNote from './components/notes/EnhancedNote.vue'
import MediaEmbed from './components/common/MediaEmbed.vue'
import AssetDiagnostics from './components/common/AssetDiagnostics.vue'
// Import reusable semantic components
import MediaThumbnail from './components/common/MediaThumbnail.vue'
import TagDisplay from './components/common/TagDisplay.vue'
// Import new foundational components
import ViewHeader from './components/common/ViewHeader.vue'
import PageIntro from './components/common/PageIntro.vue'
import ContentSection from './components/common/ContentSection.vue'
import StatusIndicator from './components/common/StatusIndicator.vue'
import CrossReferencePanel from './components/common/CrossReferencePanel.vue'
import LogUpdate from './components/log/LogUpdate.vue'
import LogFeed from './components/log/LogFeed.vue'
import NoteCard from './components/notes/NoteCard.vue'
import NotesIndex from './components/notes/NotesIndex.vue'
import WorkbookItem from './components/workbook/WorkbookItem.vue'
import WorkbookGallery from './components/workbook/WorkbookGallery.vue'
import WorkbookViewer from './components/workbook/WorkbookViewer.vue'
import WorkbookPage from './components/workbook/WorkbookPage.vue'
import WorkbookFolio from './components/workbook/WorkbookFolio.vue'
import WorkbookPageSimple from './components/workbook/WorkbookPageSimple.vue'
import WorkbookPageDebug from './components/workbook/WorkbookPageDebug.vue'
import WorkbookTest from './components/workbook/WorkbookTest.vue'
import MediaContainer from './components/workbook/MediaContainer.vue'
import PinsPage from './components/pins/PinsPage.vue'

// Import common components
import NavigationDrawer from './components/common/NavigationDrawer.vue'
import AppBar from './components/common/AppBar.vue'
// import BottomNav from './components/common/BottomNav.vue' // REMOVED: Breadcrumbs handle navigation
import VimeoEmbed from './components/common/VimeoEmbed.vue'
import Icon from './components/common/Icon.vue'
import MainLayout from './components/common/MainLayout.vue'
import FontSymphonyDemo from './components/common/FontSymphonyDemo.vue'

// Import collection components
import CollectionsGallery from './components/collections/CollectionsGallery.vue'
import TagFilter from './components/collections/TagFilter.vue'
import TagVisualization from './components/collections/TagVisualization.vue'
import StructuredTagsDisplay from './components/collections/StructuredTagsDisplay.vue'

// Import admin components (dev-only)
import AdminPanel from './components/admin/AdminPanel.vue'
import PinOrganizer from './components/admin/PinOrganizer.vue'
import CollectionManager from './components/admin/CollectionManager.vue'
import TagManager from './components/admin/TagManager.vue'
import SystemInfo from './components/admin/SystemInfo.vue'

export default {
  extends: DefaultTheme,
  Layout, // Use our custom layout
  
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
    app.component('WorkbookFolio', WorkbookFolio)
    app.component('WorkbookViewer', WorkbookViewer)
    app.component('WorkbookTest', WorkbookTest)
    app.component('WorkbookPageSimple', WorkbookPageSimple)
    app.component('WorkbookPageDebug', WorkbookPageDebug)
    app.component('MediaContainer', MediaContainer)
    app.component('AssetDiagnostics', AssetDiagnostics)
    app.component('PinsPage', PinsPage)
    app.component('Pins', PinsPage) // Also register as 'Pins' component
    app.component('pins-page', PinsPage) // Also register with kebab-case for VitePress markdown
    app.component('WorkbookPage', WorkbookPage) // Register WorkbookPage component
    app.component('workbook-page', WorkbookPage) // Also register with kebab-case
    
    // Register common components
    app.component('NavigationDrawer', NavigationDrawer)
    app.component('AppBar', AppBar)
    // app.component('BottomNav', BottomNav) // REMOVED: Breadcrumbs handle navigation
    app.component('VimeoEmbed', VimeoEmbed)
    app.component('Icon', Icon)
    app.component('MainLayout', MainLayout)
    app.component('FontSymphonyDemo', FontSymphonyDemo)
    
    // Register collection components
    app.component('CollectionsGallery', CollectionsGallery)
    app.component('TagFilter', TagFilter)
    app.component('TagVisualization', TagVisualization)
    app.component('StructuredTagsDisplay', StructuredTagsDisplay)
    
    // Register admin components (dev-only)
    app.component('AdminPanel', AdminPanel)
    app.component('PinOrganizer', PinOrganizer)
    app.component('CollectionManager', CollectionManager)
    app.component('TagManager', TagManager)
    app.component('SystemInfo', SystemInfo)
    
    // Register Cloudflare Images component
    app.component('CloudflareImage', CloudflareImage)
    
    // Register reusable semantic components
    app.component('MediaThumbnail', MediaThumbnail)
    app.component('TagDisplay', TagDisplay)
    
    // Register new foundational components
    app.component('ViewHeader', ViewHeader)
    app.component('PageIntro', PageIntro)
    app.component('ContentSection', ContentSection)
    app.component('StatusIndicator', StatusIndicator)
    app.component('CrossReferencePanel', CrossReferencePanel)
  },
  
  setup() {
    // Add body class for full-width pages when they mount
    if (typeof document !== 'undefined') {
      const observer = new MutationObserver(() => {
        const hasFullWidth = document.querySelector('.page-full-width')
        if (hasFullWidth) {
          document.body.classList.add('vp-full-width-page')
        } else {
          document.body.classList.remove('vp-full-width-page')
        }
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    }
  }
}