<script setup lang="ts">
import { ref, computed } from 'vue'
import { NTabPane, NTabs, NButton, NConfigProvider, darkTheme } from 'naive-ui'
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
      <header class="header-bar">
        <div class="header-inner">
          <div class="header-left">
            <span class="header-logo">⟨⟩</span>
            <span class="header-title">SpEL Query Builder</span>
          </div>
          <div class="header-right">
            <div class="tab-switch">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'spel-editor' }"
                @click="activeTab = 'spel-editor'"
              >Editor</button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'rule-tree' }"
                @click="activeTab = 'rule-tree'"
              >Rule&nbsp;Tree</button>
            </div>
            <NButton
              size="tiny"
              class="theme-btn"
              @click="toggleTheme"
            >
              <template #icon>
                <span :class="isDark ? 'i-carbon-sun' : 'i-carbon-moon'" />
              </template>
            </NButton>
          </div>
        </div>
      </header>

      <main class="main-area">
        <NTabPane v-if="activeTab === 'spel-editor'" tab="SpEL 编辑器">
          <SpelEditorExample :theme="theme" />
        </NTabPane>
        <NTabPane v-if="activeTab === 'rule-tree'" tab="规则树">
          <RuleTreeExample :theme="theme" />
        </NTabPane>
      </main>
    </div>
  </NConfigProvider>
</template>

<style>
*,
*::before,
*::after { box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  margin: 0;
  min-height: 100vh;
  transition: background 0.2s;
}

/* ─── Light ───────────────────────────────────────── */
.app-root.theme--light {
  --page-bg: #e8eaed;
  --surface-bg: #ffffff;
  --header-bg: #ffffff;
  --header-border: #e0e0e0;
  --header-fg: #1f1f1f;
  --tab-btn-bg: #f0f0f0;
  --tab-btn-active-bg: #1f1f1f;
  --tab-btn-active-fg: #ffffff;
  --tab-btn-fg: #555555;
}
.app-root.theme--light body { background: var(--page-bg); }

/* ─── AMOLED Pure Black ───────────────────────────── */
.app-root.theme--dark {
  --page-bg: #000000;
  --surface-bg: #111111;
  --header-bg: #000000;
  --header-border: #1a1a1a;
  --header-fg: #e0e0e0;
  --tab-btn-bg: #1a1a1a;
  --tab-btn-active-bg: #ffffff;
  --tab-btn-active-fg: #000000;
  --tab-btn-fg: #888888;
}
.app-root.theme--dark body { background: var(--page-bg); }

/* ─── Header ──────────────────────────────────────── */
.header-bar {
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  color: var(--header-fg);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-logo {
  font-size: 20px;
  font-weight: 700;
  opacity: 0.6;
}
.header-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tab-switch {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--header-border);
}
.tab-btn {
  border: none;
  background: var(--tab-btn-bg);
  color: var(--tab-btn-fg);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn.active {
  background: var(--tab-btn-active-bg);
  color: var(--tab-btn-active-fg);
}
.tab-btn:not(.active):hover {
  opacity: 0.8;
}
.theme-btn {
  opacity: 0.5;
  transition: opacity 0.15s;
}
.theme-btn:hover { opacity: 1; }

/* ─── Main ────────────────────────────────────────── */
.main-area {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
}
</style>
