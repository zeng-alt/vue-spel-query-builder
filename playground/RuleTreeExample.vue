<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { NCard, NButton, NSpace, NSwitch, NText } from 'naive-ui'
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
    // JSON 格式错误时不更新
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
  <div class="p-8">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <span class="i-carbon-flow text-3xl text-purple-400" />
          <div>
            <h2 class="text-2xl font-bold text-white">规则树</h2>
            <p class="text-gray-500 text-sm">可视化规则构建器</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-gray-400 text-sm">状态：</span>
            <NSwitch v-model:value="disabled">
              <template #checked>
                <span class="text-xs">禁用</span>
              </template>
              <template #unchecked>
                <span class="text-xs">启用</span>
              </template>
            </NSwitch>
          </div>
        </div>
      </div>

      <div class="mb-6 p-4 bg-gradient-to-r from-cyan-950/30 to-purple-950/30 rounded-xl border border-cyan-900/30">
        <div class="flex items-start gap-3">
          <span class="i-carbon-information text-cyan-400 text-xl shrink-0 mt-0.5" />
          <p class="text-gray-300 text-sm">
            通过可视化界面构建 SpEL 查询规则树，生成布尔表达式的规则树。使用分组可以创建复杂的嵌套条件。
          </p>
        </div>
      </div>

      <div class="mb-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="i-carbon-settings text-yellow-400" />
          <h3 class="text-lg font-semibold text-white">上下文配置</h3>
          <span class="text-xs text-gray-500">(提供字段供选择)</span>
        </div>
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <n-input
            v-model:value="contextText"
            type="textarea"
            :rows="6"
            placeholder="配置上下文变量..."
            class="font-mono text-sm"
          />
        </div>
      </div>

      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="i-carbon-tree-view text-green-400" />
            <h3 class="text-lg font-semibold text-white">规则树</h3>
          </div>
          <NSpace>
            <NButton size="large" @click="handleValidate">
              <template #icon>
                <span class="i-carbon-checkmark-outline" />
              </template>
              验证
            </NButton>
            <NButton size="large" @click="handleReset" quaternary>
              <template #icon>
                <span class="i-carbon-renew" />
              </template>
              重置
            </NButton>
          </NSpace>
        </div>

        <div class="bg-gray-900 rounded-xl border border-gray-800 p-6">
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
          />
        </div>
      </div>

      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="i-carbon-code-block text-pink-400" />
            <h3 class="text-lg font-semibold text-white">生成的 SpEL 表达式</h3>
          </div>
          <NButton size="large" @click="handleCopyExpression">
            <template #icon>
              <span class="i-carbon-copy" />
            </template>
            复制
          </NButton>
        </div>

        <div class="bg-gray-950 rounded-xl border border-gray-800 p-6 overflow-x-auto shadow-inner">
          <code class="text-green-400 font-mono text-sm whitespace-pre leading-relaxed">{{ spelExpression || '(空)' }}</code>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <div class="flex items-center gap-3 mb-6">
          <span class="i-carbon-book-open text-cyan-400 text-2xl" />
          <h3 class="text-lg font-semibold text-white">使用说明</h3>
        </div>
        <div class="space-y-4">
          <div class="flex items-start gap-4 p-4 bg-gray-950 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <span class="text-blue-400 font-bold">1</span>
            </div>
            <div>
              <p class="font-medium text-gray-200">选择字段</p>
              <p class="text-sm text-gray-500 mt-1">从下拉列表中选择一个上下文字段</p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-gray-950 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span class="text-green-400 font-bold">2</span>
            </div>
            <div>
              <p class="font-medium text-gray-200">选择操作</p>
              <p class="text-sm text-gray-500 mt-1">选择比较操作符（等于、不等于、包含等）</p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-gray-950 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
              <span class="text-purple-400 font-bold">3</span>
            </div>
            <div>
              <p class="font-medium text-gray-200">输入值</p>
              <p class="text-sm text-gray-500 mt-1">输入要比较的值</p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-gray-950 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <span class="text-orange-400 font-bold">4</span>
            </div>
            <div>
              <p class="font-medium text-gray-200">组合条件</p>
              <p class="text-sm text-gray-500 mt-1">使用"且/或"操作符组合多个条件</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 bg-gray-900 rounded-xl border border-gray-800">
        <div class="flex items-center gap-3 mb-6">
          <span class="i-carbon-code text-yellow-400 text-2xl" />
          <h3 class="text-lg font-semibold text-white">代码示例</h3>
        </div>
        <div class="bg-gray-950 rounded-lg p-4 overflow-x-auto">
          <pre class="text-sm text-gray-300 font-mono leading-relaxed"><code>{{ codeExample }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
