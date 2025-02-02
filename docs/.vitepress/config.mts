import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Matt Fisher",
  description: "everything that is not a fragment is invisible",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mttfshr' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/mattfisher.io' },
      { icon: 'vimeo', link: 'https://vimeo.com/mattfisherstudio' },
      { icon: 'youtube', link: 'https://www.youtube.com/@mttfshr' },
      { icon: 'spotify', link: 'https://open.spotify.com/user/gradientfade' },
      { icon: 'bandcamp', link: 'https://bandcamp.com/mattfisher' },
      { icon: 'discord', link: 'https://discordapp.com/users/476778097404805145' },
      { icon: 'instagram', link: 'https://www.instagram.com/matt_fisher/' },
      { icon: 'arc', link: 'https://mattfisherstudio.com' },
      { icon: 'arc', link: 'https://finishing-school-art.net' }
    ]
  }
})
