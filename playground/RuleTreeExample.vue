<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NCard, NButton, NSpace, NSwitch, NText } from 'naive-ui'
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
  <div class="p-6 rule-tree-example" :class="props.theme === 'dark' ? 'theme--dark' : 'theme--light'">
    <NCard title="规则树组件示例" :bordered="false" class="mb-6">
      <template #header-extra>
        <NSpace>
          <NTag :bordered="false" :type="props.theme === 'dark' ? 'info' : 'default'" size="small" class="!mr-1">
            {{ props.theme === 'dark' ? 'Dark' : 'Light' }}
          </NTag>
          <NSwitch v-model:value="disabled" size="small">
            <template #checked>禁用</template>
            <template #unchecked>启用</template>
          </NSwitch>
        </NSpace>
      </template>

      <div class="mb-4 p-3 rounded border info-banner">
        <p class="text-sm info-banner-text">
          <span class="i-carbon-information mr-2 info-banner-icon" />
          通过可视化界面构建 SpEL 查询规则树，生成布尔表达式的规则树。
        </p>
      </div>

      <div class="mb-4">
        <div class="flex items-center gap-3 mb-3">
          <NText strong>上下文配置</NText>
          <span class="text-xs text-gray-500">(提供字段供选择)</span>
        </div>
        <n-input
          v-model:value="contextText"
          type="textarea"
          :rows="6"
          placeholder="配置上下文变量..."
          class="font-mono text-sm"
        />
      </div>

      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <NText strong>规则树</NText>
          <NSpace>
            <NButton size="small" @click="handleValidate">
              <template #icon>
                <span class="i-carbon-checkmark-outline" />
              </template>
              验证
            </NButton>
            <NButton size="small" @click="handleReset">
              <template #icon>
                <span class="i-carbon-renew" />
              </template>
              重置
            </NButton>
          </NSpace>
        </div>

        <div class="border rounded-lg p-4 tree-wrapper">
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
      </div>

      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <NText strong>生成的 SpEL 表达式</NText>
          <NButton size="tiny" @click="handleCopyExpression">
            <template #icon>
              <span class="i-carbon-copy" />
            </template>
            复制
          </NButton>
        </div>

        <div class="rounded-lg p-4 overflow-x-auto spel-block">
          <code class="font-mono text-sm whitespace-pre">{{ spelExpression || '(空)' }}</code>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center gap-2 text-gray-500 text-xs">
          <span class="i-carbon-help text-gray-400" />
          <span>提示：使用分组可以创建复杂的嵌套条件</span>
        </div>
      </template>
    </NCard>

    <NCard title="使用说明" :bordered="false" class="mb-6">
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 step-blue">
            <span class="text-sm font-bold step-blue-text">1</span>
          </div>
          <div>
            <p class="font-medium step-title">选择字段</p>
            <p class="text-sm step-desc">从下拉列表中选择一个上下文字段</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 step-green">
            <span class="text-sm font-bold step-green-text">2</span>
          </div>
          <div>
            <p class="font-medium step-title">选择操作</p>
            <p class="text-sm step-desc">选择比较操作符（等于、不等于、包含等）</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 step-purple">
            <span class="text-sm font-bold step-purple-text">3</span>
          </div>
          <div>
            <p class="font-medium step-title">输入值</p>
            <p class="text-sm step-desc">输入要比较的值</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 step-orange">
            <span class="text-sm font-bold step-orange-text">4</span>
          </div>
          <div>
            <p class="font-medium step-title">组合条件</p>
            <p class="text-sm step-desc">使用"且/或"操作符组合多个条件</p>
          </div>
        </div>
      </div>
    </NCard>

    <NCard title="代码示例" :bordered="false">
      <div class="rounded-lg p-4 code-example">
        <pre class="text-sm font-mono overflow-x-auto"><code>{{ codeExample }}</code></pre>
      </div>
    </NCard>
  </div>
</template>


<style scoped>
/* ─── Light theme ──────────────────────────────────── */
.rule-tree-example.theme--light {
  --info-banner-bg: #eff6ff;
  --info-banner-border: #bfdbfe;
  --info-banner-text: #1d4ed8;
  --info-banner-icon: #3b82f6;

  --tree-wrapper-bg: #ffffff;
  --tree-wrapper-border: #e5e7eb;

  --spel-bg: #111827;
  --spel-text: #34d399;

  --step-blue-bg: #dbeafe;
  --step-blue-text: #2563eb;
  --step-green-bg: #d1fae5;
  --step-green-text: #065f46;
  --step-purple-bg: #ede9fe;
  --step-purple-text: #6d28d9;
  --step-orange-bg: #fed7aa;
  --step-orange-text: #c2410c;
  --step-text: #374151;
  --step-desc: #6b7280;

  --code-example-bg: #f9fafb;
  --code-example-text: #374151;
}

/* ─── AMOLED Pure Black dark theme ─────────────────── */
.rule-tree-example.theme--dark {
  --info-banner-bg: #0d1b2a;
  --info-banner-border: #1e3a5f;
  --info-banner-text: #93c5fd;
  --info-banner-icon: #60a5fa;

  --tree-wrapper-bg: #0a0a0a;
  --tree-wrapper-border: #222222;

  --spel-bg: #000000;
  --spel-text: #34d399;

  --step-blue-bg: #0a1a2a;
  --step-blue-text: #60a5fa;
  --step-green-bg: #0a1a0a;
  --step-green-text: #34d399;
  --step-purple-bg: #140a1a;
  --step-purple-text: #a78bfa;
  --step-orange-bg: #1a100a;
  --step-orange-text: #fb923c;
  --step-text: #cccccc;
  --step-desc: #888888;

  --code-example-bg: #0a0a0a;
  --code-example-text: #e0e0e0;
}

/* ─── Apply variables ──────────────────────────────── */
.rule-tree-example :deep(.info-banner) {
  background: var(--info-banner-bg);
  border-color: var(--info-banner-border);
}
.rule-tree-example :deep(.info-banner-text) {
  color: var(--info-banner-text);
}
.rule-tree-example :deep(.info-banner-icon) {
  color: var(--info-banner-icon);
}

.rule-tree-example :deep(.tree-wrapper) {
  background: var(--tree-wrapper-bg);
  border-color: var(--tree-wrapper-border);
}

.rule-tree-example :deep(.spel-block) {
  background: var(--spel-bg);
}
.rule-tree-example :deep(.spel-block code) {
  color: var(--spel-text);
}

/* Step circles */
.rule-tree-example :deep(.step-blue) {
  background: var(--step-blue-bg);
}
.rule-tree-example :deep(.step-blue-text) {
  color: var(--step-blue-text);
}
.rule-tree-example :deep(.step-green) {
  background: var(--step-green-bg);
}
.rule-tree-example :deep(.step-green-text) {
  color: var(--step-green-text);
}
.rule-tree-example :deep(.step-purple) {
  background: var(--step-purple-bg);
}
.rule-tree-example :deep(.step-purple-text) {
  color: var(--step-purple-text);
}
.rule-tree-example :deep(.step-orange) {
  background: var(--step-orange-bg);
}
.rule-tree-example :deep(.step-orange-text) {
  color: var(--step-orange-text);
}
.rule-tree-example :deep(.step-title) {
  color: var(--step-text);
}
.rule-tree-example :deep(.step-desc) {
  color: var(--step-desc);
}

.rule-tree-example :deep(.code-example) {
  background: var(--code-example-bg);
}
.rule-tree-example :deep(.code-example pre),
.rule-tree-example :deep(.code-example code) {
  color: var(--code-example-text);
}
</style>
