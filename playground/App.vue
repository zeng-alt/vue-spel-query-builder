<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabPane, NTabs, NButton, NConfigProvider, darkTheme, NTag } from 'naive-ui'
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
  <NConfigProvider :theme="isDark ? darkTheme : undefined">
    <div class="min-h-screen flex flex-col app-root" :class="isDark ? 'theme--dark' : 'theme--light'">
      <header class="py-6 px-6 text-center shadow-md header-bar">
        <div class="flex items-center justify-center gap-4 mb-2">
          <h1 class="text-3xl font-bold">Vue SpEL Query Builder</h1>
          <NButton
            size="small"
            :type="isDark ? 'warning' : 'default'"
            class="theme-toggle-btn"
            @click="toggleTheme"
          >
            <template #icon>
              <span :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" class="text-sm" />
            </template>
            {{ isDark ? 'Light' : 'Dark' }}
          </NButton>
        </div>
        <p class="text-base opacity-80">基于 Vue 3 + SpEL + CodeMirror + Naive UI 的在线编辑器和可视化规则树 UI</p>
      </header>

      <main class="flex-1 mx-6 mb-6 rounded-xl shadow-sm overflow-hidden main-card">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="spel-editor" tab="SpEL 编辑器">
            <SpelEditorExample :theme="theme" />
          </NTabPane>
          <NTabPane name="rule-tree" tab="规则树">
            <RuleTreeExample :theme="theme" />
          </NTabPane>
        </NTabs>
      </main>

      <footer class="py-4 text-center text-sm footer-bar">
        <p>© 2024 Vue SpEL Query Builder</p>
      </footer>
    </div>
  </NConfigProvider>
</template>

<style>
/* ─── Reset & base ────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  min-height: 100vh;
  transition: background 0.25s, color 0.25s;
}

/* ─── Light theme ─────────────────────────────────── */
.app-root.theme--light {
  --page-bg: #f0f2f5;
  --main-card-bg: #ffffff;
  --header-from: #6366f1;
  --header-to: #a855f7;
  --header-text: #ffffff;
  --footer-bg: #f9fafb;
  --footer-text: #9ca3af;
  --tab-text: #374151;
}
.app-root.theme--light body {
  background: var(--page-bg);
}

/* ─── AMOLED Pure Black dark theme ────────────────── */
.app-root.theme--dark {
  --page-bg: #000000;
  --main-card-bg: #111111;
  --header-from: #000000;
  --header-to: #1a1a2e;
  --header-text: #e0e0e0;
  --footer-bg: #0a0a0a;
  --footer-text: #555555;
  --tab-text: #aaaaaa;
}
.app-root.theme--dark body {
  background: var(--page-bg);
}

/* ─── Layout ──────────────────────────────────────── */
.header-bar {
  background: linear-gradient(to right, var(--header-from), var(--header-to));
  color: var(--header-text);
}
.theme-toggle-btn {
  flex-shrink: 0;
}
.main-card {
  background: var(--main-card-bg);
  border: 1px solid color-mix(in srgb, var(--main-card-bg) 80%, #ffffff 20%);
  transition: background 0.25s, border-color 0.25s;
}
.main-card :deep(.n-tabs-tab) {
  color: var(--tab-text) !important;
  transition: color 0.25s;
}
.footer-bar {
  background: var(--footer-bg);
  color: var(--footer-text);
  transition: background 0.25s, color 0.25s;
}
</style>
