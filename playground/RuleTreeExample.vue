<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NButton, NSwitch, NSpace } from 'naive-ui'
import { RuleTree } from '../src'
import type { RuleTreeInstance, RuleNode } from '../src'
import { createEmptyGroup } from '../src'

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
              <NSwitch v-model:value="disabled" size="small">
                <template #checked>
                  <span class="text-xs px-1">禁用</span>
                </template>
                <template #unchecked>
                  <span class="text-xs px-1">启用</span>
                </template>
              </NSwitch>
            </div>
          </div>
          <div class="config-editor">
            <n-input
              v-model:value="contextText"
              type="textarea"
              :rows="6"
              placeholder="配置上下文变量..."
              class="config-input"
            />
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
              theme="light"
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
            <NButton size="small" @click="handleCopyExpression">
              <template #icon>
                <span class="i-carbon-copy" />
              </template>
              复制
            </NButton>
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
            <NButton size="large" block type="primary" @click="handleValidate">
              <template #icon>
                <span class="i-carbon-checkmark-outline" />
              </template>
              验证规则
            </NButton>
            <NButton size="large" block @click="handleReset">
              <template #icon>
                <span class="i-carbon-renew" />
              </template>
              重置
            </NButton>
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
  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #111111;
  --bg-card: #0d0d0d;
  --border-primary: #1a1a1a;
  --border-secondary: #252525;
  --text-primary: #fafafa;
  --text-secondary: #a1a1a1;
  --text-muted: #525252;
  --accent-cyan: #22d3ee;
  --accent-purple: #a855f7;
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-pink: #ec4899;
  --accent-yellow: #eab308;

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
