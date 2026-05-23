<script setup lang="ts">
import { ref, reactive, watch, inject } from 'vue'
import { SpelEditor } from '../src'
import type { SpelEditorInstance, CustomMethod } from '../src'

const playgroundTheme = inject<import('vue').Ref<'light' | 'dark'>>('playgroundTheme')!
const playgroundSize = inject<import('vue').Ref<import('../src').ComponentSize>>('playgroundSize')!

const spelExpression = ref('authentication.details.name')

const editorRef = ref<SpelEditorInstance>()

const authentication = reactive({
  details: {
    name: 'John',
    email: 'john@example.com',
    roles: ['admin', 'user'],
  },
  users: [{ name: 'John', age: 25, address: { city: 'New York', street: 'Main St' }, tags: ['a','b'] }],
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

const customMethods: CustomMethod[] = [
  {
    name: 'isEmpty',
    argumentCount: 1,
    params: [{ name: 'value', type: 'any' }],
    returnType: 'boolean',
    description: '判断字符串或数组是否为空',
    fn: (value: unknown) => value == null || (typeof value === 'string' && value.trim().length === 0) || (Array.isArray(value) && value.length === 0),
  },
  {
    name: 'calculate',
    argumentCount: 2,
    params: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }],
    returnType: 'number',
    description: '执行自定义计算',
    fn: (a: number, b: number) => a + b,
  },
]

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
          <span class="i-carbon-terminal" />
          <div>
            <h3 class="section-title-text">表达式编辑器</h3>
            <p class="section-subtitle">输入 SpEL 表达式进行验证和执行</p>
          </div>
        </div>
        <div class="action-buttons">
          <button class="editor-btn editor-btn--primary" @click="handleRunClick">
            <span class="i-carbon-play" />
            运行
          </button>
          <button class="editor-btn" @click="handleValidateClick">
            <span class="i-carbon-checkmark" />
            验证
          </button>
          <button class="editor-btn" @click="handleGetValueClick">
            <span class="i-carbon-code" />
            取值
          </button>
        </div>
      </div>

      <div class="editor-wrapper">
        <SpelEditor
          ref="editorRef"
          v-model="spelExpression"
          :authentication="authentication"
          :principal="principal"
          :locals="locals"
          :methods="customMethods"
          :height="280"
          :theme="playgroundTheme"
          :size="playgroundSize"
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
        <span class="i-carbon-data-structured" />
        <h3 class="section-title-text">上下文变量</h3>
      </div>
      <div class="context-grid">
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-id-management" />
            <span>authentication</span>
          </div>
          <textarea
            v-model="authenticationText"
            class="plain-textarea"
            rows="5"
            placeholder="认证信息..."
          ></textarea>
        </div>
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-user" />
            <span>principal</span>
          </div>
          <textarea
            v-model="principalText"
            class="plain-textarea"
            rows="5"
            placeholder="主体信息..."
          ></textarea>
        </div>
        <div class="context-panel">
          <div class="context-label">
            <span class="i-carbon-data-blob" />
            <span>locals (#)</span>
          </div>
          <textarea
            v-model="localsText"
            class="plain-textarea"
            rows="5"
            placeholder="本地变量..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spel-editor-example {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
}

.editor-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.editor-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-primary);
}

.result-section {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid;
}

.result-success {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.result-error {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.2);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
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
  font-size: 1.25rem;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.result-title {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--text-primary);
}

.result-success .result-title {
  color: var(--accent-emerald);
}

.result-error .result-title {
  color: #ef4444;
}

.result-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.result-body {
  margin: 0;
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}

.result-success .result-body {
  color: var(--text-secondary);
}

.result-error .result-body {
  color: #ef4444;
}

.context-section {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 1rem;
}

.context-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.875rem;
}

.context-panel {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.875rem;
}

.context-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.625rem;
  letter-spacing: 0.025em;
}

/* ─── Editor buttons (replaces n-button) ───────────────────────── */
.editor-btn {
  display: inline-flex;
  align-items: center;
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

.editor-btn:hover {
  border-color: var(--border-secondary);
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.editor-btn--primary {
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.3);
  color: var(--accent-cyan);
}

.editor-btn--primary:hover {
  background: rgba(34, 211, 238, 0.15);
  border-color: rgba(34, 211, 238, 0.4);
  color: var(--accent-cyan);
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
