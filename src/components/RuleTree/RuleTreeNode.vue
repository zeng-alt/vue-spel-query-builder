<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { RuleNode, FieldOption, LogicalOperator, Expression } from '../../types'
import ExpressionEditor from './ExpressionEditor.vue'
import { formatExpression } from '../../utils'
import { StandardContext, SpelExpressionEvaluator } from 'spel2js'

const props = defineProps<{
  node: RuleNode
  authentication?: Record<string, any>
  principal?: Record<string, any>
  locals?: Record<string, any>
  disabled?: boolean
  level?: number
}>()

const emit = defineEmits<{
  (e: 'add-condition', id: string): void
  (e: 'add-group', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'update-node', id: string, updates: Partial<RuleNode>): void
}>()

const level = props.level ?? 0
const isEditing = ref(false)

const handleAddCondition = () => emit('add-condition', props.node.id)
const handleAddGroup = () => emit('add-group', props.node.id)
const handleRemove = () => emit('remove-node', props.node.id)

function handleUpdate(updates: Partial<RuleNode>) {
  emit('update-node', props.node.id, updates)
}

// ─── Field options ───────────────────────────────────────────────────────────
const fieldOptions = computed<FieldOption[]>(() => {
  const result: FieldOption[] = []
  if (props.authentication) result.push(...buildFieldOptions(props.authentication, 'authentication'))
  if (props.principal)      result.push(...buildFieldOptions(props.principal, 'principal'))
  if (props.locals)         result.push(...buildFieldOptions(props.locals, '#'))
  return result
})

function flattenFields(opts: FieldOption[]): Array<{ label: string; value: string }> {
  const result: Array<{ label: string; value: string }> = []
  for (const opt of opts) {
    if (opt.children?.length) {
      result.push(...flattenFields(opt.children as FieldOption[]))
    } else {
      result.push({ label: opt.value as string, value: opt.value as string })
    }
  }
  return result
}

function buildFieldOptions(obj: Record<string, any>, prefix = ''): FieldOption[] {
  const options: FieldOption[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix
      ? prefix === '#' ? `${prefix}${key}` : `${prefix}.${key}`
      : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      options.push({ label: key, value: fullPath, type: 'object', children: buildFieldOptions(value, fullPath) })
    } else {
      options.push({ label: key, value: fullPath, type: typeof value })
    }
  }
  return options
}

// ─── Logical operator options ─────────────────────────────────────────────────
const logicalOperatorOptions = [
  { label: '且', value: 'and' },
  { label: '或', value: 'or'  },
  { label: '非', value: 'not' },
]

const currentOperator = computed(() => props.node.operator ?? 'and')
const hasValueInput = computed(
  () => !!props.node.comparator &&
    !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(props.node.comparator)
)

// ─── Runtime type detection for left expression ──────────────────────────────
const leftType = ref<string | null>(null)

watchEffect(() => {
  if (props.node.type !== 'condition' || !props.node.left) {
    leftType.value = null
    return
  }
  const exprStr = formatExpression(props.node.left)
  if (!exprStr) {
    leftType.value = null
    return
  }
  try {
    const context = StandardContext.create(props.authentication, props.principal)
    const result = SpelExpressionEvaluator.eval(exprStr, context, props.locals)
    if (result === null || result === undefined) {
      leftType.value = 'null'
    } else {
      leftType.value = typeof result
    }
  } catch {
    leftType.value = null
  }
})

const availableComparators = computed(() => {
  const type = leftType.value

  // 所有类型都可用
  const base = [
    { label: '==', value: '==' },
    { label: '!=', value: '!=' },
    { label: 'isNull', value: 'isNull' },
    { label: 'isNotNull', value: 'isNotNull' },
  ]

  if (!type) {
    return [
      ...base,
      { label: '>', value: '>' },
      { label: '>=', value: '>=' },
      { label: '<', value: '<' },
      { label: '<=', value: '<=' },
      { label: 'isEmpty', value: 'isEmpty' },
      { label: 'isNotEmpty', value: 'isNotEmpty' },
    ]
  }

  switch (type) {
    case 'number':
      return [
        ...base,
        { label: '>', value: '>' },
        { label: '>=', value: '>=' },
        { label: '<', value: '<' },
        { label: '<=', value: '<=' },
      ]
    case 'string':
      return [
        ...base,
        { label: 'isEmpty', value: 'isEmpty' },
        { label: 'isNotEmpty', value: 'isNotEmpty' },
      ]
    case 'boolean':
      return base
    case 'object':
    case 'array':
    case 'null':
      return [
        ...base,
        { label: 'isEmpty', value: 'isEmpty' },
        { label: 'isNotEmpty', value: 'isNotEmpty' },
      ]
    default:
      return base
  }
})

watchEffect(() => {
  if (props.node.type !== 'condition') return
  const allowedValues = availableComparators.value.map(c => c.value)
  if (props.node.comparator && !allowedValues.includes(props.node.comparator)) {
    handleUpdate({ comparator: '' })
  }
})

// ─── Summary display ─────────────────────────────────────────────────────────
const isConfigured = computed(() => {
  if (props.node.type !== 'condition') return false
  return !!(props.node.left && props.node.comparator)
})

const summaryExpression = computed(() => {
  if (props.node.type !== 'condition') return { left: '', op: '', right: '' }
  return {
    left: formatExpression(props.node.left),
    op: props.node.comparator ?? '',
    right: props.node.right ? formatExpression(props.node.right) : '',
  }
})

// ─── Handlers ────────────────────────────────────────────────────────────────
function handleOperatorChange(value: LogicalOperator) {
  handleUpdate({ operator: value })
}

function updateLeft(expr: Expression) {
  handleUpdate({ left: expr })
}

function updateRight(expr: Expression) {
  handleUpdate({ right: expr })
}

function updateComparator(value: string) {
  handleUpdate({ comparator: value })
}

function toggleEdit() {
  if (!props.disabled) isEditing.value = !isEditing.value
}

function closeEdit() {
  isEditing.value = false
}

// ─── v-click-outside directive (ignores cascader/popover menus) ─────────────
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        target.closest('.n-cascader-menu') ||
        target.closest('.n-popover-shared') ||
        target.closest('.v-binder-follower-content')
      ) {
        return
      }
      if (!el.contains(target) && el !== target) {
        binding.value(event)
      }
    }
    ;(el as any).__clickOutsideHandler = handler
    document.addEventListener('click', handler, true)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).__clickOutsideHandler, true)
    delete (el as any).__clickOutsideHandler
  },
}
</script>

<template>
  <!-- CONDITION ROW -->
  <div
    v-if="node.type === 'condition'"
    v-click-outside="closeEdit"
    class="rounded-md border overflow-hidden transition-all duration-150"
    :class="[
      isEditing
        ? 'border-blue-400 bg-white shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300',
      disabled ? 'opacity-60 pointer-events-none' : '',
    ]"
  >
    <!-- Summary line -->
    <div
      class="group/row flex items-center gap-1.5 px-2.5 min-h-[34px] cursor-pointer select-none overflow-hidden"
      @click="toggleEdit"
    >
      <span class="i-carbon:rule text-[11px] text-gray-300 flex-shrink-0" />

      <template v-if="isConfigured">
        <span class="expr-chip expr-chip--field font-mono text-[11px] flex-1 min-w-0">
          {{ summaryExpression.left || '?' }}
        </span>
        <span v-if="summaryExpression.op" class="expr-chip expr-chip--op text-[11px] font-semibold flex-shrink-0">
          {{ summaryExpression.op }}
        </span>
        <span v-if="summaryExpression.right" class="expr-chip expr-chip--val font-mono text-[11px] flex-1 min-w-0">
          {{ summaryExpression.right }}
        </span>
        <span v-else-if="hasValueInput" class="text-[11px] text-gray-300 tracking-widest">···</span>
      </template>
      <span v-else class="text-xs text-gray-300 italic">点击配置条件…</span>

      <n-button
        class="!ml-auto opacity-0 group-hover/row:opacity-100 transition-opacity duration-100 flex-shrink-0"
        text size="tiny" type="error" :disabled="disabled"
        @click.stop="handleRemove"
      >
        <template #icon><span class="i-carbon:close text-xs" /></template>
      </n-button>
    </div>

    <!-- Edit panel -->
    <Transition name="slide-down">
      <div
        v-if="isEditing"
        class="border-t border-gray-100 bg-gray-50/80 px-3 py-3 space-y-2"
        @click.stop
      >
        <div class="flex items-start gap-2 flex-wrap">
          <!-- Left expression -->
          <div class="expr-block">
            <div class="expr-block__label">左侧</div>
            <div class="expr-block__body">
              <ExpressionEditor
                :model-value="node.left ?? { type: 'field', path: '' }"
                :field-options="fieldOptions"
                :disabled="disabled"
                :allow-literal="false"
                @update:model-value="updateLeft"
              />
            </div>
          </div>

          <!-- Comparator -->
          <div class="expr-block">
            <div class="expr-block__label">操作符</div>
            <div class="expr-block__body">
              <n-select
                :value="node.comparator"
                :options="availableComparators"
                placeholder="…"
                :disabled="disabled"
                size="small"
                class="!w-[108px]"
                @update:value="updateComparator"
              />
            </div>
          </div>

          <!-- Right expression -->
          <div v-if="hasValueInput" class="expr-block">
            <div class="expr-block__label">右侧</div>
            <div class="expr-block__body">
              <ExpressionEditor
                :model-value="node.right ?? { type: 'literal', value: ''}"
                :field-options="fieldOptions"
                :disabled="disabled"
                :allow-literal="true"
                @update:model-value="updateRight"
              />
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div
          v-if="isConfigured"
          class="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white border border-gray-100"
        >
          <span class="i-carbon:code text-gray-300 text-xs flex-shrink-0" />
          <code class="text-[11px] text-gray-500 leading-none">
            <span class="text-blue-600">{{ summaryExpression.left || '…' }}</span>
            <span v-if="summaryExpression.op" class="text-gray-600 mx-1">{{ summaryExpression.op }}</span>
            <span v-if="summaryExpression.right" class="text-emerald-700">{{ summaryExpression.right }}</span>
          </code>
        </div>
      </div>
    </Transition>
  </div>

  <!-- GROUP NODE -->
  <div
    v-else
    class="relative"
    :class="level > 0 ? 'ml-4' : ''"
  >
    <div v-if="level > 0" class="group-connector" />

    <!-- Group header -->
    <div class="flex items-center gap-2 mb-2">
      <div class="op-toggle">
        <button
          v-for="opt in logicalOperatorOptions"
          :key="opt.value"
          class="op-toggle__btn"
          :class="{
            'op-toggle__btn--and': currentOperator === 'and' && opt.value === 'and',
            'op-toggle__btn--or':  currentOperator === 'or'  && opt.value === 'or',
            'op-toggle__btn--not': currentOperator === 'not' && opt.value === 'not',
            'op-toggle__btn--off': currentOperator !== opt.value,
          }"
          :disabled="disabled"
          @click="handleOperatorChange(opt.value as LogicalOperator)"
        >{{ opt.label }}</button>
      </div>

      <div class="flex-1" />

      <div class="flex items-center gap-1">
        <n-button size="small" :disabled="disabled" @click="handleAddCondition">
          <template #icon><span class="i-carbon:add text-xs" /></template>
          条件
        </n-button>
        <n-button size="small" :disabled="disabled" @click="handleAddGroup">
          <template #icon><span class="i-carbon:folder-add text-xs" /></template>
          分组
        </n-button>
        <template v-if="level > 0">
          <div class="w-px h-4 bg-gray-200 mx-0.5" />
          <n-button
            size="small" quaternary circle type="error"
            :disabled="disabled" aria-label="删除分组"
            @click="handleRemove"
          >
            <template #icon><span class="i-carbon:trash-can text-sm" /></template>
          </n-button>
        </template>
      </div>
    </div>

    <!-- Group body -->
    <div class="relative pl-5">
      <div v-if="node.children && node.children.length > 0" class="group-vline" />
      <div class="flex flex-col gap-1.5">
        <template v-if="node.children && node.children.length > 0">
          <div v-for="child in node.children" :key="child.id" class="relative">
            <div class="group-hline" />
            <RuleTreeNode
              :node="child"
              :authentication="authentication"
              :principal="principal"
              :locals="locals"
              :disabled="disabled"
              :level="level + 1"
              @add-condition="(id) => $emit('add-condition', id)"
              @add-group="(id) => $emit('add-group', id)"
              @remove-node="(id) => $emit('remove-node', id)"
              @update-node="(id, updates) => $emit('update-node', id, updates)"
            />
          </div>
        </template>
        <div v-else class="flex flex-col items-center justify-center py-6 rounded-md border border-dashed border-gray-200 text-gray-300">
          <span class="i-carbon:add-alt text-xl mb-1" />
          <p class="text-[11px]">暂无条件，点击右上方按钮添加</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Slide-down transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: max-height 0.2s ease, opacity 0.15s ease;
  max-height: 400px;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

/* Summary chips */
.expr-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.expr-chip--field {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.expr-chip--op {
  background: #f3f4f6;
  color: #1f2937;
  border: 1px solid #d1d5db;
}
.expr-chip--val {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

/* Edit panel blocks */
.expr-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.expr-block__label {
  font-size: 10px;
  color: #9ca3af;
  padding-left: 2px;
  letter-spacing: 0.3px;
}
.expr-block__body {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 5px 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 36px;
}

/* Operator toggle */
.op-toggle {
  display: inline-flex;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.op-toggle__btn {
  padding: 0 12px;
  height: 26px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  line-height: 1;
}
.op-toggle__btn:last-child { border-right: none; }
.op-toggle__btn:disabled   { cursor: not-allowed; opacity: 0.5; }

.op-toggle__btn--off:not(:disabled):hover {
  background: #f9fafb;
  color: #374151;
}
.op-toggle__btn--and { background: #1d4ed8; color: #ffffff; }
.op-toggle__btn--or  { background: #d97706; color: #ffffff; }
.op-toggle__btn--not { background: #dc2626; color: #ffffff; }

/* Tree lines */
.group-vline {
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 12px;
  width: 1px;
  background: #e5e7eb;
}
.group-hline {
  position: absolute;
  left: -13px;
  top: 17px;
  width: 13px;
  height: 1px;
  background: #e5e7eb;
}
.group-connector {
  position: absolute;
  left: -9px;
  top: 17px;
  width: 9px;
  height: 1px;
  background: #e5e7eb;
}
</style>
