import { defineConfig } from 'vitepress'
import { enhancedMetadataExtractorPlugin } from './plugins/enhancedMetadataExtractor'
import { videoThumbnailsPlugin } from './plugins/videoThumbnails'

export default defineConfig({
  title: "Matt Fisher",
  description: "everything that is not a fragment is invisible",
  
  // Media handling configured below in the vite section
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Log', link: '/log' },
      { text: 'Workbook', link: '/workbook' },
      { text: 'Notes', link: '/notes' },
      { text: 'Links', items: 
        [
          { text: 'studio', link: 'https://mattfisherstudio.com' },
          { text: 'finishing school', link: 'https://finishing-school-art.net' },
          { text: 'github', link: 'https://github.com/mttfshr' },
          { text: 'bluesky', link: 'https://bsky.app/profile/mattfisher.io' },
          { text: 'vimeo', link: 'https://vimeo.com/mattfisherstudio' },
          { text: 'youtube', link: 'https://www.youtube.com/@mttfshr' },
          { text: 'spotify', link: 'https://open.spotify.com/user/gradientfade' },
          { text: 'bandcamp', link: 'https://bandcamp.com/mattfisher' },
          { text: 'discord', link: 'https://discordapp.com/users/476778097404805145' }
        ]
      }
    ],
  },
  lastUpdated: true,
  
  // Configure VitePress with plugins
  vite: {
    plugins: [
      enhancedMetadataExtractorPlugin(),
      videoThumbnailsPlugin()
    ]
  },
})