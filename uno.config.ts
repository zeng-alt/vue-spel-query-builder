import { defineConfig, presetWind3 } from 'unocss'
import presetIcons from 'unocss/preset-icons'
import carbon from '@iconify-json/stash/carbon.json'

export default defineConfig({
  presets: [
    presetWind3(),
    presetIcons({
      collections: {
        carbon: carbon as any,
      },
      scale: 1.2,
      warn: true,
    }),
  ],
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/, 'src/**/*.{js,ts}'],
    },
  },
})
