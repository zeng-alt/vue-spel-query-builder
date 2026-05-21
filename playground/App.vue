<script setup lang="ts">
import { ref } from 'vue'
import { NConfigProvider, NTabPane, NTabs, darkTheme } from 'naive-ui'
import SpelEditorExample from './SpelEditorExample.vue'
import RuleTreeExample from './RuleTreeExample.vue'

const activeTab = ref('spel-editor')
const theme = ref<'light' | 'dark'>('light')

const isDark = computed(() => theme.value === 'dark')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <!-- <NConfigProvider :theme="darkTheme"> -->
    <div class="min-h-screen bg-black text-gray-100 flex flex-col">
      <header class="bg-black border-b border-gray-800 py-8 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="i-carbon-code text-4xl text-cyan-400" />
                <h1 class="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Vue SpEL Query Builder
                </h1>
              </div>
              <p class="text-gray-400 text-lg">
                基于 Vue 3 + SpEL + CodeMirror + Naive UI 的在线编辑器和可视化规则树 UI
              </p>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                <span class="i-carbon-lightning text-yellow-400" />
                <span class="text-sm text-gray-400">AMOLED Pure Black</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 bg-black p-6">
        <div class="max-w-7xl mx-auto">
          <div class="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            <NTabs v-model:value="activeTab" type="line" animated size="large">
              <NTabPane name="spel-editor" tab="SpEL 编辑器">
                <SpelEditorExample />
              </NTabPane>
              <NTabPane name="rule-tree" tab="规则树">
                <RuleTreeExample />
              </NTabPane>
            </NTabs>
          </div>
        </div>
      </main>

      <footer class="bg-black border-t border-gray-800 py-6">
        <div class="max-w-7xl mx-auto px-6">
          <div class="flex items-center justify-between">
            <p class="text-gray-500 text-sm">
              © 2024 Vue SpEL Query Builder
            </p>
            <div class="flex items-center gap-6">
              <a href="#" class="text-gray-500 hover:text-cyan-400 transition-colors flex items-center gap-2">
                <span class="i-carbon-logo-github" />
                <span class="text-sm">GitHub</span>
              </a>
              <a href="#" class="text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-2">
                <span class="i-carbon-documentation" />
                <span class="text-sm">文档</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  <!-- </NConfigProvider> -->
</template>

<style>
*,
*::before,
*::after { box-sizing: border-box; }

body {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #000;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #000;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
