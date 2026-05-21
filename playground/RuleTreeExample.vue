<script setup lang="ts">
import { ref, reactive, computed, watch, inject } from 'vue'
import { RuleTree } from '../src'
import type { RuleTreeInstance, RuleNode } from '../src'
import { createEmptyGroup } from '../src'

const playgroundTheme = inject<import('vue').Ref<'light' | 'dark'>>('playgroundTheme')!

const ruleTreeRef = ref<RuleTreeInstance>()

const initialRule = createEmptyGroup('and')

const ruleTreeData = ref<RuleNode>(initialRule)

const context = reactive({
  user: {
    name: '张三',
    age: 28,
    email: 'zhangsan@example.com',
    roles: [{code: 'admin', label: '管理员'}, {code: 'user', label: '普通用户'}],
    active: true,
  },
  order: {
    id: 'ORD-001',
    amount: 1000,
    status: 'completed',
    items: ['item1', 'item2'],
  },
})

const contextText = ref(JSON.stringify(context, null, 2))

watch(contextText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(context, parsed)
  } catch {
  }
})

const disabled = ref(false)

const spelExpression = computed(() => {
  return ruleTreeRef.value?.getSpelExpression() ?? ''
})

const handleValidate = () => {
  const isValid = ruleTreeRef.value?.validate() ?? false
  console.log('Validation result:', isValid)
}

const handleReset = () => {
  ruleTreeData.value = createEmptyGroup('and')
}

const handleCopyExpression = () => {
  navigator.clipboard.writeText(spelExpression.value)
}

const codeExample = `import { ref } from 'vue'
import { RuleTree, createEmptyGroup } from '@zeng-alt/vue-spel-query-builder'

const ruleData = ref(createEmptyGroup('and'))

const context = {
  user: {
    name: '张三',
    age: 28,
    active: true,
  },
}

const handleChange = (rule) => {
  console.log('Rule changed:', rule)
}`
</script>

<template>
  <div class="rule-tree-example">
    <div class="info-banner">
      <div class="banner-content">
        <span class="i-carbon-information text-cyan-400 text-xl" />
        <p class="text-sm text-gray-300">
          通过可视化界面构建 SpEL 查询规则树，生成布尔表达式的规则树。使用分组可以创建复杂的嵌套条件。
        </p>
      </div>
    </div>

    <div class="main-grid">
      <div class="left-column">
        <div class="config-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-settings text-xl text-amber-400" />
              <div>
                <h3 class="text-base font-semibold text-white">上下文配置</h3>
                <p class="text-xs text-gray-500">提供字段供选择</p>
              </div>
            </div>
            <div class="control-group">
              <span class="control-label">状态</span>
              <button
                class="toggle-btn"
                :class="{ 'toggle-btn--on': !disabled, 'toggle-btn--off': disabled }"
                @click="disabled = !disabled"
              >
                <span class="toggle-btn__dot" />
                <span class="toggle-btn__label">{{ disabled ? '禁用' : '启用' }}</span>
              </button>
            </div>
          </div>
          <div class="config-editor">
            <textarea
              v-model="contextText"
              class="plain-textarea"
              rows="6"
              placeholder="配置上下文变量..."
            ></textarea>
          </div>
        </div>

        <div class="tree-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-tree-view-alt text-xl text-emerald-400" />
              <div>
                <h3 class="text-base font-semibold text-white">规则树</h3>
                <p class="text-xs text-gray-500">构建查询条件</p>
              </div>
            </div>
          </div>
          <div class="tree-container">
            <RuleTree
              ref="ruleTreeRef"
              v-model="ruleTreeData"
              :context="context"
              :authentication="{
                details: {
                  name: 'John',
                  permissions: ['read', 'write', 'delete'],
                }
              }"
              :principal="{
                date: '1111',
              }"
              :locals="context"
              :disabled="disabled"
              :theme="playgroundTheme"
            />
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="output-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-code text-xl text-pink-400" />
              <div>
                <h3 class="text-base font-semibold text-white">生成的表达式</h3>
                <p class="text-xs text-gray-500">SpEL 格式</p>
              </div>
            </div>
            <button class="plain-btn" @click="handleCopyExpression">
              <span class="i-carbon-copy" />
              复制
            </button>
          </div>
          <div class="output-display">
            <code class="expression-code">{{ spelExpression || '(空)' }}</code>
          </div>
        </div>

        <div class="actions-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-tool-kit text-xl text-cyan-400" />
              <h3 class="text-base font-semibold text-white">操作</h3>
            </div>
          </div>
          <div class="actions-grid">
            <button class="plain-btn plain-btn--primary" @click="handleValidate">
              <span class="i-carbon-checkmark-outline" />
              验证规则
            </button>
            <button class="plain-btn" @click="handleReset">
              <span class="i-carbon-renew" />
              重置
            </button>
          </div>
        </div>

        <div class="guide-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-book text-xl text-purple-400" />
              <h3 class="text-base font-semibold text-white">使用指南</h3>
            </div>
          </div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <p class="step-title">选择字段</p>
                <p class="step-desc">从下拉列表中选择一个上下文字段</p>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <p class="step-title">选择操作</p>
                <p class="step-desc">选择比较操作符（等于、不等于、包含等）</p>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <p class="step-title">输入值</p>
                <p class="step-desc">输入要比较的值</p>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <p class="step-title">组合条件</p>
                <p class="step-desc">使用"且/或"操作符组合多个条件</p>
              </div>
            </div>
          </div>
        </div>

        <div class="code-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-application text-xl text-yellow-400" />
              <h3 class="text-base font-semibold text-white">代码示例</h3>
            </div>
          </div>
          <div class="code-display">
            <pre class="code-block"><code>{{ codeExample }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rule-tree-example {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem;
}

.info-banner {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
  border: 1px solid rgba(34, 211, 238, 0.15);
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.banner-content p {
  margin: 0;
  line-height: 1.5;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.25rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-header h3 {
  margin: 0;
}

.section-header p {
  margin: 0;
}

.config-section,
.tree-section,
.output-section,
.actions-section,
.guide-section,
.code-section {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 1.25rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.config-editor {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-secondary);
}

.config-input {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
}

.tree-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  min-height: 300px;
}

.output-display {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  min-height: 80px;
  overflow-x: auto;
}

.expression-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875rem;
  color: var(--accent-emerald);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--bg-primary);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.step-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.code-display {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.code-block {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre;
}

@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .right-column {
    order: -1;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>

/* ─── Toggle button (replaces NSwitch) ─────────────────────────── */
.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 9999px;
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 0.75rem;
}

.toggle-btn--on {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
}

.toggle-btn--off {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toggle-btn__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.toggle-btn--on .toggle-btn__dot {
  background: var(--accent-emerald);
}

.toggle-btn--off .toggle-btn__dot {
  background: #ef4444;
}

.toggle-btn__label {
  font-weight: 500;
}

/* ─── Plain button (replaces NButton) ──────────────────────────── */
.plain-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  line-height: 1.4;
  white-space: nowrap;
}

.plain-btn:hover {
  border-color: var(--border-secondary);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.plain-btn--primary {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
  border-color: rgba(34, 211, 238, 0.2);
  color: var(--accent-cyan);
}

.plain-btn--primary:hover {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  border-color: rgba(34, 211, 238, 0.3);
  color: var(--accent-cyan);
}

.actions-grid .plain-btn,
.actions-grid .plain-btn--primary {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

/* ─── Plain textarea (replaces n-input textarea) ───────────────── */
.plain-textarea {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: none;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: background 0.2s;
}

.plain-textarea::placeholder {
  color: var(--text-muted);
}

.plain-textarea:focus {
  background: var(--bg-tertiary);
}
</style>
