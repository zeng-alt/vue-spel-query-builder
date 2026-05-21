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
  <div class="spel-editor-example">
    <div class="editor-section">
      <div class="section-header">
        <div class="section-title">
          <span class="i-carbon-terminal text-2xl text-cyan-400" />
          <div>
            <h3 class="text-lg font-semibold text-white">表达式编辑器</h3>
            <p class="text-sm text-gray-500">输入 SpEL 表达式进行验证和执行</p>
          </div>
        </div>
        <div class="action-buttons">
          <n-button size="medium" type="primary" @click="handleRunClick">
            <template #icon>
              <span class="i-carbon-play" />
            </template>
            运行
          </n-button>
          <n-button size="medium" @click="handleValidateClick">
            <template #icon>
              <span class="i-carbon-checkmark" />
            </template>
            验证
          </n-button>
          <n-button size="medium" quaternary @click="handleGetValueClick">
            <template #icon>
              <span class="i-carbon-code" />
            </template>
            取值
          </n-button>
        </div>
      </div>

      <div class="editor-wrapper">
        <SpelEditor
          ref="editorRef"
          v-model="spelExpression"
          :authentication="authentication"
          :principal="principal"
          :locals="locals"
          :height="280"
          theme="dark"
          @validate="handleValidate"
          @change="handleChange"
          @run="handleRun"
        />
      </div>
    </div>

    <div v-if="runResult" class="result-section" :class="runResult.error ? 'result-error' : 'result-success'">
      <div class="result-header">
        <span class="result-icon">
          <span v-if="runResult.error" class="i-carbon-close-outline text-red-400" />
          <span v-else class="i-carbon-checkmark-outline text-emerald-400" />
        </span>
        <div class="result-info">
          <span class="result-title">{{ runResult.error ? '执行错误' : '执行结果' }}</span>
          <span v-if="!runResult.error" class="result-type">{{ getResultType(runResult.result) }}</span>
        </div>
      </div>
      <pre class="result-body">{{ runResult.error || formatResult(runResult.result) }}</pre>
    </div>

    <div class="context-section">
      <div class="context-header">
        <span class="i-carbon-data-structured text-xl text-purple-400" />
        <h3 class="text-base font-semibold text-white">上下文变量</h3>
      </div>
      <div class="context-grid">
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-id-management text-cyan-400" />
            <span>authentication</span>
          </div>
          <n-input
            v-model:value="authenticationText"
            type="textarea"
            size="small"
            :rows="5"
            placeholder="认证信息..."
            class="context-input"
          />
        </div>
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-user text-emerald-400" />
            <span>principal</span>
          </div>
          <n-input
            v-model:value="principalText"
            type="textarea"
            size="small"
            :rows="5"
            placeholder="主体信息..."
            class="context-input"
          />
        </div>
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-data-blob text-amber-400" />
            <span>locals (#)</span>
          </div>
          <n-input
            v-model:value="localsText"
            type="textarea"
            size="small"
            :rows="5"
            placeholder="本地变量..."
            class="context-input"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spel-editor-example {
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
  --accent-red: #ef4444;

  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
}

.editor-section {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 1.25rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.editor-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-secondary);
}

.result-section {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid;
}

.result-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
  border-color: rgba(16, 185, 129, 0.2);
}

.result-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
  border-color: rgba(239, 68, 68, 0.2);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid;
}

.result-success .result-header {
  border-bottom-color: rgba(16, 185, 129, 0.1);
}

.result-error .result-header {
  border-bottom-color: rgba(239, 68, 68, 0.1);
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.result-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.result-success .result-title {
  color: var(--accent-emerald);
}

.result-error .result-title {
  color: var(--accent-red);
}

.result-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.result-body {
  margin: 0;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}

.result-success .result-body {
  color: var(--text-secondary);
}

.result-error .result-body {
  color: var(--accent-red);
}

.context-section {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 1.25rem;
}

.context-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.context-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
}

.context-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.context-input {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: flex-start;
  }

  .context-grid {
    grid-template-columns: 1fr;
  }
}
</style>
