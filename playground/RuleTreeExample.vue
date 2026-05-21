<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NButton, NSwitch } from 'naive-ui'
import { RuleTree } from '../src'
import type { RuleTreeInstance, RuleNode } from '../src'
import { createEmptyGroup } from '../src'

const props = defineProps<{
  theme: 'light' | 'dark'
}>()

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
    // JSON 格式错误时不更新
  }
})

const disabled = ref(false)



ruleTreeRef.value?.setSpelExpression("(authentication.details.name == '123456' && #user.name == '456' && (authentication.details.name == '11111' || principal.date == '2222222222'))")

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
  <div class="rule-tree-example" :class="props.theme === 'dark' ? 'theme--dark' : 'theme--light'">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-group">
        <n-button size="tiny" @click="handleValidate">验证</n-button>
        <n-button size="tiny" @click="handleReset">重置</n-button>
        <n-button size="tiny" @click="handleCopyExpression">复制</n-button>
      </div>
      <div class="toolbar-spacer" />
      <div class="toolbar-right">
        <span class="disabled-label">禁用</span>
        <NSwitch v-model:value="disabled" size="small" />
      </div>
    </div>

    <!-- Rule tree -->
    <div class="tree-border">
      <RuleTree
        ref="ruleTreeRef"
        v-model="ruleTreeData"
        :theme="props.theme"
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
      />
    </div>

    <!-- Context & Expression side by side -->
    <div class="bottom-grid">
      <div class="ctx-section">
        <div class="section-head">Context</div>
        <n-input
          type="textarea"
          size="tiny"
          :rows="5"
          v-model:value="contextText"
          class="ctx-input"
        />
      </div>
      <div class="expr-section">
        <div class="section-head">Expression</div>
        <div class="expr-block">
          <code class="expr-code">{{ spelExpression || '(empty)' }}</code>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.rule-tree-example {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Light ────────────────────────────────────────── */
.rule-tree-example.theme--light {
  --toolbar-bg: #f5f5f5;
  --toolbar-border: #e0e0e0;
  --tree-border: #e0e0e0;
  --section-head-fg: #555555;
  --expr-bg: #f6f6f6;
  --expr-border: #e0e0e0;
  --expr-fg: #1f1f1f;
  --disabled-label: #888888;
  --ctx-input-bg: #fafafa;
}

/* ─── AMOLED Pure Black dark ───────────────────────── */
.rule-tree-example.theme--dark {
  --toolbar-bg: #0a0a0a;
  --toolbar-border: #1a1a1a;
  --tree-border: #1a1a1a;
  --section-head-fg: #777777;
  --expr-bg: #0a0a0a;
  --expr-border: #1a1a1a;
  --expr-fg: #cccccc;
  --disabled-label: #555555;
  --ctx-input-bg: #0a0a0a;
}

/* ─── Toolbar ──────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--toolbar-bg);
  border: 1px solid var(--toolbar-border);
  border-radius: 4px;
}
.toolbar-group { display: flex; gap: 4px; }
.toolbar-spacer { flex: 1; }
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.disabled-label {
  font-size: 11px;
  color: var(--disabled-label);
}

/* ─── Tree border ──────────────────────────────────── */
.tree-border {
  border: 1px solid var(--tree-border);
  border-radius: 4px;
  overflow: hidden;
}

/* ─── Bottom grid ──────────────────────────────────── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.section-head {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--section-head-fg);
  margin-bottom: 6px;
}

/* ─── Context ──────────────────────────────────────── */
.ctx-input {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
}

/* ─── Expression ───────────────────────────────────── */
.expr-block {
  background: var(--expr-bg);
  border: 1px solid var(--expr-border);
  border-radius: 4px;
  padding: 10px;
  min-height: 105px;
  overflow-x: auto;
}
.expr-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--expr-fg);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}
</style>
