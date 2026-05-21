import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: false,
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueSpelQueryBuilder',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', 'naive-ui', '@codemirror/view', '@codemirror/state', '@codemirror/commands', '@codemirror/autocomplete', '@codemirror/language', 'codemirror', 'spel2js', '@lezer/highlight'],
      output: {
        globals: {
          vue: 'Vue',
          'naive-ui': 'naive-ui',
        },
        assetFileNames: 'assets/vue-spel-query-builder[extname]',
        entryFileNames: 'index.[format]',
      },
    },
    cssCodeSplit: false,
    minify: false,
    sourcemap: true,
  },
})
