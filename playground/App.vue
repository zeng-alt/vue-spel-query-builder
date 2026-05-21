<script setup lang="ts">
import { ref } from 'vue'
import SpelEditorExample from './SpelEditorExample.vue'
import RuleTreeExample from './RuleTreeExample.vue'

const activeTab = ref('spel-editor')
</script>

<template>
  <div class="app-container">
    <div class="ambient-glow ambient-glow-1" />
    <div class="ambient-glow ambient-glow-2" />
    
    <header class="header">
      <div class="header-content">
        <div class="brand-section">
          <div class="brand-icon">
            <span class="i-carbon-code text-5xl" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">
              <span class="title-gradient">Vue SpEL Query Builder</span>
            </h1>
            <p class="brand-subtitle">在线编辑器和可视化规则树 UI</p>
          </div>
        </div>
        
        <div class="header-badges">
          <div class="badge badge-theme">
            <span class="i-carbon-lightning text-amber-400" />
            <span class="badge-text">AMOLED Pure Black</span>
          </div>
          <div class="badge badge-version">
            <span class="i-carbon-tag text-emerald-400" />
            <span class="badge-text">v1.0.0</span>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="card-container">
        <div class="tabs-wrapper">
          <NTabs v-model:value="activeTab" type="segment" animated>
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
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');

.app-container {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #111111;
  --border-primary: #1a1a1a;
  --border-secondary: #252525;
  --text-primary: #fafafa;
  --text-secondary: #a1a1a1;
  --text-muted: #525252;
  --accent-cyan: #22d3ee;
  --accent-purple: #a855f7;
  --accent-pink: #ec4899;
  --accent-amber: #f59e0b;
  --accent-emerald: #10b981;
  --accent-gradient: linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #ec4899 100%);
  
  position: relative;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

.ambient-glow {
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  z-index: 0;
}

.ambient-glow-1 {
  top: -200px;
  left: -200px;
  width: 600px;
  height: 600px;
  background: var(--accent-cyan);
}

.ambient-glow-2 {
  bottom: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  background: var(--accent-purple);
}

.header {
  position: relative;
  z-index: 10;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, transparent 100%);
  border-bottom: 1px solid var(--border-primary);
  padding: 2.5rem 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  color: var(--accent-cyan);
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.1);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.brand-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.title-gradient {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  backdrop-filter: blur(8px);
}

.badge-text {
  letter-spacing: 0.025em;
}

.main-content {
  position: relative;
  z-index: 5;
  padding: 2rem;
  min-height: calc(100vh - 180px);
}

.card-container {
  max-width: 1400px;
  margin: 0 auto;
}

.tabs-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.03),
    0 20px 50px -12px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.footer {
  position: relative;
  z-index: 10;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  padding: 1.5rem 2rem;
}

.footer-content {
  max-width: 1400px;
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

@media (max-width: 768px) {
  .header {
    padding: 1.5rem 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .brand-title {
    font-size: 1.5rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .tabs-wrapper {
    padding: 1rem;
    border-radius: 16px;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
