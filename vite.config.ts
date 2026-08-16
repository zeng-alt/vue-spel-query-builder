import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    UnoCSS(),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: true,
    }),
  ],
  root: './playground',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@zeng-alt/vue-spel-query-builder$': resolve(__dirname, 'dist/index.mjs'),
      '@zeng-alt/vue-spel-query-builder/style.css': resolve(__dirname, 'dist/assets/vue-spel-query-builder.css'),
    },
  },
})
