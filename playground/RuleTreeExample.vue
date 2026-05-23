<script setup lang="ts">
import { ref, reactive, computed, watch, inject } from 'vue'
import { RuleTree } from '../src'
import type { RuleTreeInstance, RuleNode, CustomMethod } from '../src'
import { createEmptyGroup } from '../src'

const playgroundTheme = inject<import('vue').Ref<'light' | 'dark'>>('playgroundTheme')!
const playgroundSize = inject<import('vue').Ref<import('../src').ComponentSize>>('playgroundSize')!

const ruleTreeRef = ref<RuleTreeInstance>()

const initialRule = createEmptyGroup('and')

const ruleTreeData = ref<RuleNode>(initialRule)

const authentication = reactive({
  details: {
    name: 'John',
    email: 'john@example.com',
    permissions: ['read', 'write', 'delete'],
  },
  authenticated: true,
})

const authenticationText = ref(JSON.stringify(authentication, null, 2))

watch(authenticationText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(authentication, parsed)
  } catch {
  }
})

const principal = reactive({
  id: '12345',
  username: 'john_doe',
  enabled: true,
})

const principalText = ref(JSON.stringify(principal, null, 2))

watch(principalText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(principal, parsed)
  } catch {
  }
})

const locals = reactive({
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

const localsText = ref(JSON.stringify(locals, null, 2))

watch(localsText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(locals, parsed)
  } catch {
  }
})

const customMethods: CustomMethod[] = [
  {
    name: 'isEmpty',
    argumentCount: 1,
    params: [{ name: 'value', type: 'any' }],
    returnType: 'boolean',
    description: '判断字符串或数组是否为空',
  },
  {
    name: 'calculate',
    argumentCount: 2,
    params: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }],
    returnType: 'number',
    description: '执行自定义计算',
  },
]

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

// ─── SpEL → 规则树 ────────────────────────────────────────────
const spelInput = ref(`#user.roles.?[code == 'admin'].size() == 1 && #user.age > 18`)

const handleApplyExpression = () => {
  if (spelInput.value.trim()) {
    ruleTreeRef.value?.setSpelExpression(spelInput.value)
  }
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
        <span class="i-carbon-information text-cyan-400" />
        <p class="banner-text">
          通过可视化界面构建 SpEL 查询规则树，生成布尔表达式的规则树。使用分组可以创建复杂的嵌套条件。
        </p>
      </div>
    </div>

    <div class="main-grid">
      <div class="left-column">
        <div class="config-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-settings" />
              <div>
                <h3 class="section-title-text">上下文配置</h3>
                <p class="section-subtitle">提供字段供选择</p>
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
          <div class="config-grid">
            <div class="config-panel">
              <div class="config-panel-label">
                <span class="i-carbon-id-management" />
                <span>authentication</span>
              </div>
              <textarea v-model="authenticationText" class="plain-textarea" rows="4" placeholder="认证信息..."></textarea>
            </div>
            <div class="config-panel">
              <div class="config-panel-label">
                <span class="i-carbon-user" />
                <span>principal</span>
              </div>
              <textarea v-model="principalText" class="plain-textarea" rows="4" placeholder="主体信息..."></textarea>
            </div>
            <div class="config-panel">
              <div class="config-panel-label">
                <span class="i-carbon-data-blob" />
                <span>locals (#)</span>
              </div>
              <textarea v-model="localsText" class="plain-textarea" rows="4" placeholder="本地变量..."></textarea>
            </div>
          </div>
        </div>

        <div class="tree-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-tree-view-alt" />
              <div>
                <h3 class="section-title-text">规则树</h3>
                <p class="section-subtitle">构建查询条件</p>
              </div>
            </div>
          </div>
          <div class="tree-container">
            <RuleTree
              ref="ruleTreeRef"
              v-model="ruleTreeData"
              :authentication="authentication"
              :principal="principal"
              :locals="locals"
              :methods="customMethods"
              :disabled="disabled"
              :theme="playgroundTheme"
              :size="playgroundSize"
            />
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="output-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-code" />
              <div>
                <h3 class="section-title-text">生成的表达式</h3>
                <p class="section-subtitle">SpEL 格式</p>
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

        <!-- SpEL → 规则树解析 -->
        <div class="parse-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-spell-check" />
              <div>
                <h3 class="section-title-text">SpEL → 规则树</h3>
                <p class="section-subtitle">输入表达式解析为规则树</p>
              </div>
            </div>
            <button class="plain-btn plain-btn--primary" @click="handleApplyExpression">
              <span class="i-carbon-arrow-right" />
              应用
            </button>
          </div>
          <div class="input-display">
            <textarea
              v-model="spelInput"
              class="plain-textarea"
              rows="3"
              placeholder="输入 SpEL 表达式..."
            ></textarea>
          </div>
        </div>

        <div class="actions-section">
          <div class="section-header">
            <div class="section-title">
              <span class="i-carbon-tool-kit" />
              <h3 class="section-title-text">操作</h3>
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
              <span class="i-carbon-book" />
              <h3 class="section-title-text">使用指南</h3>
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
              <span class="i-carbon-application" />
              <h3 class="section-title-text">代码示例</h3>
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
  gap: 1rem;
  padding: 0.5rem;
}

.info-banner {
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.15);
  border-radius: 10px;
  padding: 0.875rem 1rem;
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.banner-text {
  margin: 0;
  line-height: 1.5;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.875rem;
  flex-wrap: wrap;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.section-title-text {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.section-subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.config-section,
.tree-section,
.output-section,
.parse-section,
.actions-section,
.guide-section,
.code-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
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

.config-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.625rem;
}

.config-panel {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.75rem;
}

.config-panel-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.025em;
}

.config-panel .plain-textarea {
  min-height: 80px;
  resize: vertical;
}

.config-input {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
}

.tree-container {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.875rem;
  min-height: 300px;
}

.output-display,
.input-display {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.875rem;
  min-height: 60px;
  overflow-x: auto;
}

.output-display {
  min-height: 60px;
}

.input-display {
  padding: 0;
  min-height: auto;
  overflow: visible;
}

.input-display .plain-textarea {
  border-radius: 8px;
  min-height: 80px;
}

.expression-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: var(--accent-emerald);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--accent-cyan);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bg-primary);
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.125rem 0;
}

.step-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.code-display {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.875rem;
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

<style>
/* ─── Toggle button (replaces NSwitch) ─────────────────────────── */
.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 0.75rem;
}

.toggle-btn--on {
  background: rgba(16, 185, 129, 0.1);
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
  border-radius: 2px;
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
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
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
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.plain-btn--primary {
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.3);
  color: var(--accent-cyan);
}

.plain-btn--primary:hover {
  background: rgba(34, 211, 238, 0.15);
  border-color: rgba(34, 211, 238, 0.4);
  color: var(--accent-cyan);
}

.actions-grid .plain-btn,
.actions-grid .plain-btn--primary {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.8125rem;
}

/* ─── Plain textarea (replaces n-input textarea) ───────────────── */
.plain-textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.625rem 0.75rem;
  padding-bottom: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
  overflow: auto;
  min-height: 100px;
  max-height: 300px;
}

.plain-textarea::placeholder {
  color: var(--text-muted);
}

.plain-textarea:hover {
  border-color: var(--accent-cyan);
}

.plain-textarea:focus {
  border-color: var(--accent-cyan);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.1);
}

.plain-textarea::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.plain-textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.plain-textarea::-webkit-scrollbar-thumb {
  background: var(--border-secondary);
  border-radius: 3px;
}

.plain-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--accent-cyan);
}

.plain-textarea::-webkit-resizer {
  position: absolute;
  width: 100%;
  height: 24px;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.05));
  border: none;
  cursor: ns-resize;
  bottom: 0;
  left: 0;
}

.plain-textarea::-webkit-resizer::before {
  content: '';
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: var(--border-secondary);
  border-radius: 2px;
  transition: all 0.2s;
}

.plain-textarea::-webkit-resizer::after {
  content: '';
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: var(--border-secondary);
  border-radius: 2px;
  opacity: 0.5;
  transition: all 0.2s;
}

.plain-textarea:hover::-webkit-resizer::before {
  background: var(--accent-cyan);
  height: 5px;
}

.plain-textarea:hover::-webkit-resizer::after {
  background: var(--accent-cyan);
  opacity: 0.7;
}
</style>
