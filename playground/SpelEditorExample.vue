<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
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

const authenticationText = ref(JSON.stringify(authentication, null, 2))

watch(authenticationText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(locals, parsed)
  } catch {
    // JSON 格式错误时不更新
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
    Object.assign(locals, parsed)
  } catch {
    // JSON 格式错误时不更新
  }
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

const localsText = ref(JSON.stringify(locals, null, 2))

watch(localsText, (val) => {
  try {
    const parsed = JSON.parse(val)
    Object.assign(locals, parsed)
  } catch {
    // JSON 格式错误时不更新
  }
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
  <div class="p-8">
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-4">
        <span class="i-carbon-terminal text-3xl text-cyan-400" />
        <h2 class="text-2xl font-bold text-white">SpEL Editor</h2>
      </div>
      <p class="text-gray-400 mb-6">
        基于 CodeMirror 的 SpEL 表达式编辑器，支持语法高亮、智能提示和表达式运行。
      </p>

      <div class="flex flex-wrap gap-3 mb-6">
        <n-button type="primary" @click="handleValidateClick" size="large">
          <template #icon>
            <span class="i-carbon-checkmark-outline" />
          </template>
          验证表达式
        </n-button>
        <n-button type="success" @click="handleRunClick" size="large">
          <template #icon>
            <span class="i-carbon-play" />
          </template>
          运行表达式
        </n-button>
        <n-button @click="handleGetValueClick" size="large">
          <template #icon>
            <span class="i-carbon-code" />
          </template>
          获取当前值
        </n-button>
      </div>

      <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
        <div class="bg-gray-950 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-red-500" />
          <span class="w-3 h-3 rounded-full bg-yellow-500" />
          <span class="w-3 h-3 rounded-full bg-green-500" />
          <span class="ml-4 text-xs text-gray-500 font-mono">spel-editor</span>
        </div>
        <SpelEditor
          ref="editorRef"
          v-model="spelExpression"
          :authentication="authentication"
          :principal="principal"
          :locals="locals"
          :height="320"
          @validate="handleValidate"
          @change="handleChange"
          @run="handleRun"
          theme="dark"
        />
      </div>

      <div v-if="runResult" class="mt-6 p-6 rounded-xl border" :class="runResult.error ? 'bg-red-950/30 border-red-900/50' : 'bg-green-950/30 border-green-900/50'">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">
            <template v-if="runResult.error">
              <span class="i-carbon-error text-red-400" />
            </template>
            <template v-else>
              <span class="i-carbon-checkmark text-green-400" />
            </template>
          </span>
          <h4 class="font-semibold text-lg" :class="runResult.error ? 'text-red-400' : 'text-green-400'">
            {{ runResult.error ? '执行失败' : '执行成功' }}
          </h4>
        </div>
        <div v-if="runResult.error" class="text-red-300 font-mono text-sm bg-red-900/20 p-4 rounded-lg">
          {{ runResult.error }}
        </div>
        <div v-else class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full font-mono">
              {{ getResultType(runResult.result) }}
            </span>
            <span class="text-sm text-gray-400">结果类型</span>
          </div>
          <pre class="font-mono text-sm bg-gray-900 p-4 rounded-xl border border-gray-800 overflow-x-auto text-cyan-300">{{ formatResult(runResult.result) }}</pre>
        </div>
      </div>

      <div class="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <div class="flex items-center gap-2 mb-3">
          <span class="i-carbon-code text-yellow-400" />
          <h4 class="text-sm font-medium text-gray-300">当前表达式</h4>
        </div>
        <code class="font-mono text-sm text-yellow-300 break-all">{{ spelExpression }}</code>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="p-6 bg-gradient-to-br from-blue-950/50 to-black rounded-xl border border-blue-900/30 hover:border-blue-500/50 transition-all duration-300">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <span class="i-carbon-user-avatar text-2xl text-blue-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-blue-400">authentication</h3>
            <p class="text-xs text-gray-500">用户认证信息</p>
          </div>
        </div>
        <n-input type="textarea" :rows="8" v-model:value="authenticationText" class="font-mono text-sm" />
      </div>

      <div class="p-6 bg-gradient-to-br from-green-950/50 to-black rounded-xl border border-green-900/30 hover:border-green-500/50 transition-all duration-300">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <span class="i-carbon-key text-2xl text-green-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-green-400">principal</h3>
            <p class="text-xs text-gray-500">基础变量信息</p>
          </div>
        </div>
        <n-input type="textarea" :rows="8" v-model:value="principalText" class="font-mono text-sm" />
      </div>

      <div class="p-6 bg-gradient-to-br from-purple-950/50 to-black rounded-xl border border-purple-900/30 hover:border-purple-500/50 transition-all duration-300">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <span class="i-carbon-variable text-2xl text-purple-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-purple-400">locals</h3>
            <p class="text-xs text-gray-500">本地变量 (使用 # 前缀)</p>
          </div>
        </div>
        <n-input type="textarea" :rows="8" v-model:value="localsText" class="font-mono text-sm" />
      </div>
    </div>

    <div class="p-6 bg-gray-900 rounded-xl border border-gray-800">
      <div class="flex items-center gap-3 mb-6">
        <span class="i-carbon-book text-pink-400 text-2xl" />
        <h3 class="text-lg font-semibold text-white">使用示例</h3>
      </div>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-blue-400 font-mono text-sm whitespace-nowrap shrink-0">authentication.details.name</code>
          <span class="text-gray-400 text-sm">- 访问认证信息（蓝色高亮）</span>
        </li>
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-green-400 font-mono text-sm whitespace-nowrap shrink-0">principal.username</code>
          <span class="text-gray-400 text-sm">- 访问主体信息（绿色高亮）</span>
        </li>
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-purple-400 font-mono text-sm whitespace-nowrap shrink-0">#user.name</code>
          <span class="text-gray-400 text-sm">- 访问本地变量（紫色高亮，注意 # 前缀）</span>
        </li>
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-cyan-400 font-mono text-sm whitespace-nowrap shrink-0">#user.age > 18</code>
          <span class="text-gray-400 text-sm">- 比较运算</span>
        </li>
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-yellow-400 font-mono text-sm whitespace-nowrap shrink-0">#user.name.concat(' Doe')</code>
          <span class="text-gray-400 text-sm">- 字符串拼接</span>
        </li>
        <li class="flex items-start gap-3 p-3 bg-gray-950 rounded-lg hover:bg-gray-800 transition-colors">
          <code class="text-pink-400 font-mono text-sm whitespace-nowrap shrink-0">authentication.authenticated and #user.active</code>
          <span class="text-gray-400 text-sm">- 逻辑与</span>
        </li>
      </ul>
    </div>
  </div>
</template>
