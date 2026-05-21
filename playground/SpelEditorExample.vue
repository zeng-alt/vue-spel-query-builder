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
  <div class="spel-editor-example" :class="isDark ? 'theme--dark' : 'theme--light'">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-group">
        <n-button size="tiny" @click="handleValidateClick">验证</n-button>
        <n-button size="tiny" @click="handleRunClick">运行</n-button>
        <n-button size="tiny" @click="handleGetValueClick">取值</n-button>
      </div>
      <div class="toolbar-spacer" />
      <span class="expr-label">SPEL</span>
    </div>

    <!-- Editor -->
    <div class="editor-border">
      <SpelEditor
        ref="editorRef"
        v-model="spelExpression"
        :authentication="authentication"
        :principal="principal"
        :locals="locals"
        :height="260"
        @validate="handleValidate"
        @change="handleChange"
        @run="handleRun"
        :theme="props.theme"
      />
    </div>

    <!-- Result -->
    <div v-if="runResult" class="result-panel" :class="runResult.error ? 'is-error' : 'is-ok'">
      <div class="result-header">
        <span :class="runResult.error ? 'result-icon-error' : 'result-icon-ok'" class="result-icon" />
        <span class="result-title">{{ runResult.error ? 'Error' : 'Result' }}</span>
        <span class="result-type">{{ runResult.error ? '' : getResultType(runResult.result) }}</span>
      </div>
      <pre v-if="runResult.error" class="result-body">{{ runResult.error }}</pre>
      <pre v-else class="result-body">{{ formatResult(runResult.result) }}</pre>
    </div>

    <!-- Context panels -->
    <div class="context-grid">
      <div class="ctx-panel">
        <div class="ctx-head">authentication</div>
        <n-input type="textarea" size="tiny" :rows="4" v-model:value="authenticationText" />
      </div>
      <div class="ctx-panel">
        <div class="ctx-head">principal</div>
        <n-input type="textarea" size="tiny" :rows="4" v-model:value="principalText" />
      </div>
      <div class="ctx-panel">
        <div class="ctx-head">locals (#)</div>
        <n-input type="textarea" size="tiny" :rows="4" v-model:value="localsText" />
      </div>
    </div>
  </div>
</template>


<style scoped>
.spel-editor-example {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Light ───────────────────────────────────────── */
.spel-editor-example.theme--light {
  --toolbar-bg: #f5f5f5;
  --toolbar-border: #e0e0e0;
  --editor-border: #e0e0e0;
  --result-ok-bg: #f6f6f6;
  --result-ok-border: #e0e0e0;
  --result-ok-fg: #1f1f1f;
  --result-ok-type: #888888;
  --result-error-bg: #fdf2f2;
  --result-error-border: #fecaca;
  --result-error-fg: #b91c1c;
  --ctx-bg: #fafafa;
  --ctx-border: #e0e0e0;
  --ctx-head-fg: #555555;
  --expr-label-fg: #aaaaaa;
}

/* ─── AMOLED Dark ─────────────────────────────────── */
.spel-editor-example.theme--dark {
  --toolbar-bg: #0a0a0a;
  --toolbar-border: #1a1a1a;
  --editor-border: #1a1a1a;
  --result-ok-bg: #0a0a0a;
  --result-ok-border: #1a1a1a;
  --result-ok-fg: #cccccc;
  --result-ok-type: #666666;
  --result-error-bg: #1a0a0a;
  --result-error-border: #3a1515;
  --result-error-fg: #f87171;
  --ctx-bg: #0a0a0a;
  --ctx-border: #1a1a1a;
  --ctx-head-fg: #777777;
  --expr-label-fg: #444444;
}

/* ─── Toolbar ─────────────────────────────────────── */
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
.expr-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--expr-label-fg);
}

/* ─── Editor ──────────────────────────────────────── */
.editor-border {
  border: 1px solid var(--editor-border);
  border-radius: 4px;
  overflow: hidden;
}

/* ─── Result ──────────────────────────────────────── */
.result-panel {
  border-radius: 4px;
  border: 1px solid;
  overflow: hidden;
}
.result-panel.is-ok {
  background: var(--result-ok-bg);
  border-color: var(--result-ok-border);
}
.result-panel.is-error {
  background: var(--result-error-bg);
  border-color: var(--result-error-border);
}
.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
}
.result-panel.is-ok .result-header {
  color: var(--result-ok-fg);
  border-bottom: 1px solid var(--result-ok-border);
}
.result-panel.is-error .result-header {
  color: var(--result-error-fg);
  border-bottom: 1px solid var(--result-error-border);
}
.result-icon { font-size: 13px; }
.result-icon-ok::before { content: '✓'; color: #22c55e; }
.result-icon-error::before { content: '✗'; color: var(--result-error-fg); }
.result-title { flex: 1; }
.result-type {
  font-weight: 400;
  color: var(--result-ok-type);
  font-size: 10px;
}
.result-body {
  margin: 0;
  padding: 10px;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-x: auto;
  color: var(--result-ok-fg);
}
.result-panel.is-error .result-body {
  color: var(--result-error-fg);
}

/* ─── Context panels ──────────────────────────────── */
.context-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.ctx-panel {
  background: var(--ctx-bg);
  border: 1px solid var(--ctx-border);
  border-radius: 4px;
  padding: 8px;
}
.ctx-head {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--ctx-head-fg);
  margin-bottom: 6px;
}
</style>
