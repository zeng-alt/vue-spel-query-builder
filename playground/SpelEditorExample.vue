<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { SpelEditor } from '../src'
import type { SpelEditorInstance } from '../src'

const props = defineProps<{
  theme: 'light' | 'dark'
}>()

const isDark = computed(() => props.theme === 'dark')

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
  <div class="p-6 max-w-4xl mx-auto spel-editor-example" :class="isDark ? 'theme--dark' : 'theme--light'">
    <h2 class="text-2xl font-bold mb-6 page-title">SpEL Editor 示例</h2>

    <div class="mb-8">
      <h3 class="text-lg font-semibold mb-4 section-title">SpEL 表达式编辑器</h3>
      <p class="mb-4 desc-text">
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
            <i class="i-carbon:play text-800"/>
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

      <div class="rounded-lg overflow-hidden editor-wrapper">
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
          :theme="props.theme"
        />
      </div>

      <div v-if="runResult" class="mt-4 p-4 rounded-lg border" :class="runResult.error ? 'result-error' : 'result-success'">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">
            <template v-if="runResult.error">
              <span class="i-carbon-x-circle result-error-icon" />
            </template>
            <template v-else>
              <span class="i-carbon-check-circle result-success-icon" />
            </template>
          </span>
          <h4 class="font-medium" :class="runResult.error ? 'result-error-text' : 'result-success-text'">
            {{ runResult.error ? '执行失败' : '执行成功' }}
          </h4>
        </div>
        <div v-if="runResult.error" class="text-sm result-error-msg">
          {{ runResult.error }}
        </div>
        <div v-else class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded result-type-badge">
              {{ getResultType(runResult.result) }}
            </span>
            <span class="text-sm result-type-label">结果类型</span>
          </div>
          <pre class="font-mono text-sm p-3 rounded border overflow-x-auto result-pre">{{ formatResult(runResult.result) }}</pre>
        </div>
      </div>

      <div class="mt-4 p-3 rounded current-expr">
        <h4 class="text-sm font-medium mb-2 current-expr-label">当前表达式：</h4>
        <code class="font-mono text-sm current-expr-code">{{ spelExpression }}</code>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-4 rounded-lg border context-card context-card--auth">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-user-avatar context-icon--auth" /></span>
          <h3 class="text-lg font-semibold context-title--auth">authentication</h3>
        </div>
        <p class="text-sm mb-2 context-desc--auth">用户认证信息</p>
        <n-input type="textarea" autosize v-model:value="authenticationText"/>
      </div>

      <div class="p-4 rounded-lg border context-card context-card--principal">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-key context-icon--principal" /></span>
          <h3 class="text-lg font-semibold context-title--principal">principal</h3>
        </div>
        <p class="text-sm mb-2 context-desc--principal">基础变量信息</p>
        <n-input type="textarea" autosize v-model:value="principalText"/>
      </div>

      <div class="p-4 rounded-lg border context-card context-card--locals">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl"><span class="i-carbon-variable context-icon--locals" /></span>
          <h3 class="text-lg font-semibold context-title--locals">locals</h3>
        </div>
        <p class="text-sm mb-2 context-desc--locals">本地变量 (使用 # 前缀)</p>
        <n-input type="textarea" autosize v-model:value="localsText"/>
      </div>
    </div>

    <div class="mt-8 p-4 rounded-lg examples-section">
      <h3 class="text-lg font-semibold mb-3 examples-title">使用示例</h3>
      <ul class="text-sm space-y-2 examples-list">
        <li><code class="examples-code--blue">authentication.details.name</code> - 访问认证信息（蓝色高亮）</li>
        <li><code class="examples-code--green">principal.username</code> - 访问主体信息（绿色高亮）</li>
        <li><code class="examples-code--purple">#user.name</code> - 访问本地变量（紫色高亮，注意 # 前缀）</li>
        <li><code class="examples-code--gray">#user.age > 18</code> - 比较运算</li>
        <li><code class="examples-code--gray">#user.name.concat(' Doe')</code> - 字符串拼接</li>
        <li><code class="examples-code--gray">authentication.authenticated and #user.active</code> - 逻辑与</li>
        <li><code class="examples-code--gray">#user.age * 2</code> - 数学运算（返回数值类型）</li>
        <li><code class="examples-code--gray">#user.name.length()</code> - 字符串长度（返回数值类型）</li>
      </ul>
    </div>
  </div>
</template>


<style scoped>
/* ─── Light theme (default) ────────────────────────── */
.spel-editor-example.theme--light {
  --page-title: #1f2937;
  --section-title: #374151;
  --desc-text: #6b7280;
  --editor-wrapper-border: #e5e7eb;
  --editor-wrapper-bg: #ffffff;
  --result-error-bg: #fef2f2;
  --result-error-border: #fecaca;
  --result-error-text: #991b1b;
  --result-error-msg: #dc2626;
  --result-error-icon: #ef4444;
  --result-success-bg: #f9fafb;
  --result-success-border: #e5e7eb;
  --result-success-text: #374151;
  --result-success-icon: #22c55e;
  --result-type-badge-bg: #e5e7eb;
  --result-type-badge-text: #6b7280;
  --result-type-label: #4b5563;
  --result-pre-bg: #ffffff;
  --result-pre-border: #e5e7eb;
  --current-expr-bg: #f9fafb;
  --current-expr-label: #4b5563;
  --current-expr-code: #1f2937;
  --context-auth-bg: #eff6ff;
  --context-auth-border: #bfdbfe;
  --context-auth-icon: #3b82f6;
  --context-auth-title: #1d4ed8;
  --context-auth-desc: #2563eb;
  --context-principal-bg: #f0fdf4;
  --context-principal-border: #bbf7d0;
  --context-principal-icon: #22c55e;
  --context-principal-title: #15803d;
  --context-principal-desc: #16a34a;
  --context-locals-bg: #faf5ff;
  --context-locals-border: #e9d5ff;
  --context-locals-icon: #a855f7;
  --context-locals-title: #7e22ce;
  --context-locals-desc: #9333ea;
  --examples-bg: #f9fafb;
  --examples-title: #374151;
  --examples-list: #4b5563;
  --examples-code-blue: #3b82f6;
  --examples-code-green: #22c55e;
  --examples-code-purple: #a855f7;
  --examples-code-gray: #6b7280;
}

/* ─── AMOLED Pure Black dark theme ─────────────────── */
.spel-editor-example.theme--dark {
  --page-title: #e5e5e5;
  --section-title: #cccccc;
  --desc-text: #888888;
  --editor-wrapper-border: #222222;
  --editor-wrapper-bg: #0a0a0a;
  --result-error-bg: #1a0a0a;
  --result-error-border: #3a1515;
  --result-error-text: #fca5a5;
  --result-error-msg: #f87171;
  --result-error-icon: #ef4444;
  --result-success-bg: #0a1a0a;
  --result-success-border: #153a15;
  --result-success-text: #cccccc;
  --result-success-icon: #22c55e;
  --result-type-badge-bg: #222222;
  --result-type-badge-text: #888888;
  --result-type-label: #aaaaaa;
  --result-pre-bg: #000000;
  --result-pre-border: #222222;
  --current-expr-bg: #0a0a0a;
  --current-expr-label: #888888;
  --current-expr-code: #e0e0e0;
  --context-auth-bg: #0a1420;
  --context-auth-border: #1a3050;
  --context-auth-icon: #60a5fa;
  --context-auth-title: #93c5fd;
  --context-auth-desc: #60a5fa;
  --context-principal-bg: #0a1a0a;
  --context-principal-border: #1a3a1a;
  --context-principal-icon: #34d399;
  --context-principal-title: #6ee7b7;
  --context-principal-desc: #34d399;
  --context-locals-bg: #140a1a;
  --context-locals-border: #2a1a3a;
  --context-locals-icon: #a78bfa;
  --context-locals-title: #c4b5fd;
  --context-locals-desc: #a78bfa;
  --examples-bg: #0a0a0a;
  --examples-title: #cccccc;
  --examples-list: #888888;
  --examples-code-blue: #60a5fa;
  --examples-code-green: #34d399;
  --examples-code-purple: #a78bfa;
  --examples-code-gray: #888888;
}

/* ─── Apply variables ──────────────────────────────── */
.page-title { color: var(--page-title); }
.section-title { color: var(--section-title); }
.desc-text { color: var(--desc-text); }
.editor-wrapper {
  border: 1px solid var(--editor-wrapper-border);
  background: var(--editor-wrapper-bg);
}
.result-error { background: var(--result-error-bg); border-color: var(--result-error-border); }
.result-error-text { color: var(--result-error-text); }
.result-error-msg { color: var(--result-error-msg); }
.result-error-icon { color: var(--result-error-icon); }
.result-success { background: var(--result-success-bg); border-color: var(--result-success-border); }
.result-success-text { color: var(--result-success-text); }
.result-success-icon { color: var(--result-success-icon); }
.result-type-badge { background: var(--result-type-badge-bg); color: var(--result-type-badge-text); }
.result-type-label { color: var(--result-type-label); }
.result-pre { background: var(--result-pre-bg); border-color: var(--result-pre-border); }
.current-expr { background: var(--current-expr-bg); }
.current-expr-label { color: var(--current-expr-label); }
.current-expr-code { color: var(--current-expr-code); }
.context-card { transition: background 0.25s, border-color 0.25s; }
.context-card--auth { background: var(--context-auth-bg); border-color: var(--context-auth-border); }
.context-icon--auth { color: var(--context-auth-icon); }
.context-title--auth { color: var(--context-auth-title); }
.context-desc--auth { color: var(--context-auth-desc); }
.context-card--principal { background: var(--context-principal-bg); border-color: var(--context-principal-border); }
.context-icon--principal { color: var(--context-principal-icon); }
.context-title--principal { color: var(--context-principal-title); }
.context-desc--principal { color: var(--context-principal-desc); }
.context-card--locals { background: var(--context-locals-bg); border-color: var(--context-locals-border); }
.context-icon--locals { color: var(--context-locals-icon); }
.context-title--locals { color: var(--context-locals-title); }
.context-desc--locals { color: var(--context-locals-desc); }
.examples-section { background: var(--examples-bg); transition: background 0.25s; }
.examples-title { color: var(--examples-title); }
.examples-list { color: var(--examples-list); }
.examples-code--blue { color: var(--examples-code-blue); }
.examples-code--green { color: var(--examples-code-green); }
.examples-code--purple { color: var(--examples-code-purple); }
.examples-code--gray { color: var(--examples-code-gray); }
</style>
