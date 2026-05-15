<script setup lang="ts">
import { ref, reactive } from 'vue'
import { SpelEditor } from '../src'
import type { SpelEditorInstance } from '../src'

const spelExpression = ref('authentication.details.name')

const editorRef = ref<SpelEditorInstance>()

const authentication = reactive({
  details: {
    name: 'John',
    email: 'john@example.com',
    roles: ['admin', 'user'],
  },
  authenticated: true,
})

const principal = reactive({
  id: '12345',
  username: 'john_doe',
  enabled: true,
})

const locals = reactive({
  user: {
    name: 'John',
    age: 25,
    active: true,
  },
  order: {
    id: 'ORD-001',
    amount: 100.50,
    status: 'completed',
  },
})

const runResult = ref<{ result?: any; error?: string }>()

const handleValidate = (isValid: boolean, error?: string) => {
  console.log('Validation result:', { isValid, error })
}

const handleChange = (value: string) => {
  console.log('Expression changed:', value)
}

const handleRun = (result: any, error?: string) => {
  runResult.value = { result, error }
  console.log('Run result:', { result, error })
}

const handleValidateClick = async () => {
  if (editorRef.value) {
    const isValid = await editorRef.value.validate()
    console.log('Manual validation:', isValid)
  }
}

const handleGetValueClick = () => {
  if (editorRef.value) {
    console.log('Current value:', editorRef.value.getValue())
  }
}

const handleRunClick = async () => {
  if (editorRef.value) {
    runResult.value = undefined
    const result = await editorRef.value.run()
    console.log('Run result:', result)
  }
}

const getResultType = (result: any): string => {
  if (result === null) return 'null'
  if (result === undefined) return 'undefined'
  if (Array.isArray(result)) return 'array'
  return typeof result
}

const formatResult = (result: any): string => {
  if (result === null) return 'null'
  if (result === undefined) return 'undefined'
  if (typeof result === 'object') {
    return JSON.stringify(result, null, 2)
  }
  return String(result)
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">SpEL Editor 示例</h2>
    
    <div class="mb-8">
      <h3 class="text-lg font-semibold text-gray-700 mb-4">SpEL 表达式编辑器</h3>
      <p class="text-gray-500 mb-4">
        基于 CodeMirror 的 SpEL 表达式编辑器，支持语法高亮、智能提示和表达式运行。
      </p>
      
      <div class="flex gap-3 mb-4">
        <n-button type="primary" @click="handleValidateClick">
          <template #icon>
            <div class="i-carbon-checkmark-outline" />
          </template>
          验证表达式
        </n-button>
        <n-button type="success" @click="handleRunClick">
          <template #icon>
            <div class="i-carbon-play" />
          </template>
          运行表达式
        </n-button>
        <n-button @click="handleGetValueClick">
          <template #icon>
            <div class="i-carbon-code" />
          </template>
          获取当前值
        </n-button>
      </div>
      
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <SpelEditor
          ref="editorRef"
          v-model="spelExpression"
          :authentication="authentication"
          :principal="principal"
          :locals="locals"
          :height="300"
          @validate="handleValidate"
          @change="handleChange"
          @run="handleRun"
        />
      </div>
      
      <div v-if="runResult" class="mt-4 p-4 rounded-lg border" :class="runResult.error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">
            <template v-if="runResult.error">
              <span class="i-carbon-x-circle text-red-500" />
            </template>
            <template v-else>
              <span class="i-carbon-check-circle text-green-500" />
            </template>
          </span>
          <h4 class="font-medium" :class="runResult.error ? 'text-red-700' : 'text-gray-700'">
            {{ runResult.error ? '执行失败' : '执行成功' }}
          </h4>
        </div>
        <div v-if="runResult.error" class="text-red-600 text-sm">
          {{ runResult.error }}
        </div>
        <div v-else class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {{ getResultType(runResult.result) }}
            </span>
            <span class="text-sm text-gray-600">结果类型</span>
          </div>
          <pre class="font-mono text-sm bg-white p-3 rounded border border-gray-200 overflow-x-auto">{{ formatResult(runResult.result) }}</pre>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-gray-50 rounded">
        <h4 class="text-sm font-medium text-gray-600 mb-2">当前表达式：</h4>
        <code class="font-mono text-sm text-gray-800">{{ spelExpression }}</code>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-user-avatar text-blue-500" /></span>
          <h3 class="text-lg font-semibold text-blue-700">authentication</h3>
        </div>
        <p class="text-sm text-blue-600 mb-2">用户认证信息</p>
        <pre class="font-mono text-sm text-blue-800 bg-blue-100/50 p-2 rounded">{{ JSON.stringify(authentication, null, 2) }}</pre>
      </div>
      
      <div class="p-4 bg-green-50 rounded-lg border border-green-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-key text-green-500" /></span>
          <h3 class="text-lg font-semibold text-green-700">principal</h3>
        </div>
        <p class="text-sm text-green-600 mb-2">基础变量信息</p>
        <pre class="font-mono text-sm text-green-800 bg-green-100/50 p-2 rounded">{{ JSON.stringify(principal, null, 2) }}</pre>
      </div>
      
      <div class="p-4 bg-purple-50 rounded-lg border border-purple-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-variable text-purple-500" /></span>
          <h3 class="text-lg font-semibold text-purple-700">locals</h3>
        </div>
        <p class="text-sm text-purple-600 mb-2">本地变量 (使用 # 前缀)</p>
        <pre class="font-mono text-sm text-purple-800 bg-purple-100/50 p-2 rounded">{{ JSON.stringify(locals, null, 2) }}</pre>
      </div>
    </div>
    
    <div class="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">使用示例</h3>
      <ul class="text-sm text-gray-600 space-y-2">
        <li><code class="text-blue-500">authentication.details.name</code> - 访问认证信息（蓝色高亮）</li>
        <li><code class="text-green-500">principal.username</code> - 访问主体信息（绿色高亮）</li>
        <li><code class="text-purple-500">#user.name</code> - 访问本地变量（紫色高亮，注意 # 前缀）</li>
        <li><code class="text-gray-500">#user.age > 18</code> - 比较运算</li>
        <li><code class="text-gray-500">#user.name.concat(' Doe')</code> - 字符串拼接</li>
        <li><code class="text-gray-500">authentication.authenticated and #user.active</code> - 逻辑与</li>
        <li><code class="text-gray-500">#user.age * 2</code> - 数学运算（返回数值类型）</li>
        <li><code class="text-gray-500">#user.name.length()</code> - 字符串长度（返回数值类型）</li>
      </ul>
    </div>
  </div>
</template>
