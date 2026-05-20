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
    roles: ['admin', 'user'],
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
  <div class="p-6">
    <NCard title="规则树组件示例" :bordered="false" class="mb-6">
      <template #header-extra>
        <NSpace>
          <NSwitch v-model:value="disabled" size="small">
            <template #checked>禁用</template>
            <template #unchecked>启用</template>
          </NSwitch>
        </NSpace>
      </template>

      <div class="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
        <p class="text-sm text-blue-700">
          <span class="i-carbon-information text-blue-500 mr-2" />
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

        <div class="border border-gray-200 rounded-lg p-4 bg-white">
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

        <div class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <code class="text-green-400 font-mono text-sm whitespace-pre">{{ spelExpression || '(空)' }}</code>
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
          <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <span class="text-blue-600 text-sm font-bold">1</span>
          </div>
          <div>
            <p class="font-medium text-gray-700">选择字段</p>
            <p class="text-sm text-gray-500">从下拉列表中选择一个上下文字段</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <span class="text-green-600 text-sm font-bold">2</span>
          </div>
          <div>
            <p class="font-medium text-gray-700">选择操作</p>
            <p class="text-sm text-gray-500">选择比较操作符（等于、不等于、包含等）</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
            <span class="text-purple-600 text-sm font-bold">3</span>
          </div>
          <div>
            <p class="font-medium text-gray-700">输入值</p>
            <p class="text-sm text-gray-500">输入要比较的值</p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
            <span class="text-orange-600 text-sm font-bold">4</span>
          </div>
          <div>
            <p class="font-medium text-gray-700">组合条件</p>
            <p class="text-sm text-gray-500">使用"且/或"操作符组合多个条件</p>
          </div>
        </div>
      </div>
    </NCard>

    <NCard title="代码示例" :bordered="false">
      <div class="bg-gray-50 rounded-lg p-4">
        <pre class="text-sm text-gray-700 font-mono overflow-x-auto"><code>{{ codeExample }}</code></pre>
      </div>
    </NCard>
  </div>
</template>
