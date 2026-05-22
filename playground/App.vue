<script setup lang="ts">
import { ref, provide, computed, type Ref } from 'vue'
import SpelEditorExample from './SpelEditorExample.vue'
import RuleTreeExample from './RuleTreeExample.vue'

const activeTab = ref('spel-editor')

const playgroundTheme = ref<'light' | 'dark'>('dark')
provide<Ref<'light' | 'dark'>>('playgroundTheme', playgroundTheme)

function toggleTheme() {
  playgroundTheme.value = playgroundTheme.value === 'dark' ? 'light' : 'dark'
}

const currentComponent = computed(() => {
  switch (activeTab.value) {
    case 'spel-editor':
      return SpelEditorExample

    case 'rule-tree':
      return RuleTreeExample

    default:
      return SpelEditorExample
  }
})
</script>

<template>
  <div class="app-container" :data-theme="playgroundTheme">
    <header class="header">
      <div class="header-content">
        <div class="brand-section">
          <div class="brand-icon">
            <span class="i-carbon-code text-4xl" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Vue SpEL Query Builder</h1>
            <p class="brand-subtitle">在线编辑器和可视化规则树 UI</p>
          </div>
        </div>

        <div class="header-controls">
          <button class="theme-toggle" :title="playgroundTheme === 'dark' ? '切换到亮色' : '切换到暗色'" @click="toggleTheme">
            <span v-if="playgroundTheme === 'dark'" class="i-carbon-sun" />
            <span v-else class="i-carbon-moon" />
            <span class="theme-text">{{ playgroundTheme === 'dark' ? '暗色' : '亮色' }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="card-container">
        <div class="tabs-wrapper">
          <div class="tabs-bar">
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'spel-editor' }"
              @click="activeTab = 'spel-editor'"
            >SpEL 编辑器</button>
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'rule-tree' }"
              @click="activeTab = 'rule-tree'"
            >规则树</button>
          </div>
          <div class="tab-content">
            <!-- <SpelEditorExample v-if="activeTab === 'spel-editor'" />
            <RuleTreeExample v-else-if="activeTab === 'rule-tree'" /> -->
            <KeepAlive>
              <component :is="currentComponent" />
            </KeepAlive>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="footer-copyright">© 2024 Vue SpEL Query Builder</span>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">
            <span class="i-carbon-logo-github" />
            <span>GitHub</span>
          </a>
          <a href="#" class="footer-link">
            <span class="i-carbon-documentation" />
            <span>文档</span>
          </a>
          <a href="#" class="footer-link">
            <span class="i-carbon-help" />
            <span>帮助</span>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght400;500;600&family=Inter:wght400;500;600;700&display=swap');

/* ─── Theme variables: dark (default) ─────────────────────────────── */
.app-container[data-theme="dark"] {
  --bg-primary: #0f1117;
  --bg-secondary: #161821;
  --bg-tertiary: #1e2030;
  --border-primary: #2e3142;
  --border-secondary: #3a3d4f;
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --accent-cyan: #22d3ee;
  --accent-purple: #a855f7;
  --accent-pink: #ec4899;
  --accent-amber: #f59e0b;
  --accent-emerald: #10b981;
}

/* ─── Theme variables: light ──────────────────────────────────────── */
.app-container[data-theme="light"] {
  --bg-primary: #f9fafb;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f3f4f6;
  --border-primary: #e5e7eb;
  --border-secondary: #d1d5db;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-cyan: #06b6d4;
  --accent-purple: #8b5cf6;
  --accent-pink: #ec4899;
  --accent-amber: #d97706;
  --accent-emerald: #059669;
}

.app-container {
  position: relative;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
  transition: background 0.3s, color 0.3s;
}

.header {
  position: relative;
  z-index: 10;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: 1.5rem 2rem;
  transition: background 0.3s, border-color 0.3s;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  color: var(--accent-cyan);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* ─── Header controls ──────────────────────────────────────────── */
.header-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  font-family: inherit;
}

.theme-toggle:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.theme-text {
  letter-spacing: 0.025em;
}

/* ─── Main content ──────────────────────────────────────────────── */
.main-content {
  position: relative;
  z-index: 5;
  padding: 1.5rem 2rem;
  min-height: calc(100vh - 150px);
}

.card-container {
  max-width: 1200px;
  margin: 0 auto;
}

.tabs-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  transition: background 0.3s, border-color 0.3s;
}

/* ─── Tabs bar ──────────────────────────────────────────────────── */
.tabs-bar {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.25rem;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.tab-btn:hover {
  color: var(--text-secondary);
}

.tab-btn--active {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-content {
  min-height: 200px;
}

/* ─── Footer ────────────────────────────────────────────────────── */
.footer {
  position: relative;
  z-index: 10;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: 1rem 2rem;
  transition: background 0.3s, border-color 0.3s;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-copyright {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--accent-cyan);
}

/* ─── Responsive ────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-title {
    font-size: 1.125rem;
  }

  .main-content {
    padding: 1rem;
  }

  .tabs-wrapper {
    padding: 0.75rem;
    border-radius: 12px;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}
</style>
