<script setup lang="ts">
import { computed, ref, watchEffect, watch } from 'vue'
import type { RuleNode, FieldOption, LogicalOperator, Expression, ListFilter } from '../../types'
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

// ─── 字段树构建（包含对象元素的内部字段）───────────────────────────
const fieldOptions = computed<FieldOption[]>(() => {
  const result: FieldOption[] = []
  if (props.authentication) result.push(...buildFieldOptions(props.authentication, 'authentication'))
  if (props.principal)      result.push(...buildFieldOptions(props.principal, 'principal'))
  if (props.locals)         result.push(...buildFieldOptions(props.locals, '#'))
  return result
})

function buildFieldOptions(obj: Record<string, any>, prefix = ''): FieldOption[] {
  const options: FieldOption[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? (prefix === '#' ? `#${key}` : `${prefix}.${key}`) : key
    if (Array.isArray(value)) {
      const elementType = value.length > 0 ? typeof value[0] : 'number'
      const option: FieldOption = { label: key, value: fullPath, type: 'array', elementType }
      if (elementType === 'object' && value.length > 0 && value[0] && !Array.isArray(value[0])) {
        option.elementChildren = buildFieldOptions(value[0], '') // 取第一个元素构建子字段
      }
      options.push(option)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      options.push({ label: key, value: fullPath, type: 'object', children: buildFieldOptions(value, fullPath) })
    } else {
      options.push({ label: key, value: fullPath, type: typeof value })
    }
  }
  return options
}

// ─── 逻辑分组操作符 ──────────────────────────────────────────
const logicalOperatorOptions = [
  { label: '且', value: 'and' },
  { label: '或', value: 'or' },
  { label: '非', value: 'not' },
]
const currentOperator = computed(() => props.node.operator ?? 'and')

// ─── 运行时类型检测 ──────────────────────────────────────────
function getDetailedType(val: any): string {
  if (val === null || val === undefined) return 'null'
  if (Array.isArray(val)) return 'array'
  const t = typeof val
  if (t === 'object') return 'object'
  return t
}

const leftType = ref<string | null>(null)
watchEffect(() => {
  if (props.node.type !== 'condition' || !props.node.left) {
    leftType.value = null
    return
  }
  const exprStr = formatExpression(props.node.left)
  if (!exprStr) { leftType.value = null; return }
  try {
    const context = StandardContext.create(props.authentication, props.principal)
    const result = SpelExpressionEvaluator.eval(exprStr, context, props.locals)
    leftType.value = getDetailedType(result)
  } catch { leftType.value = null }
})

// ─── 通用操作符生成函数 ──────────────────────────────────────
function getComparatorsForType(type: string | null): { label: string; value: string }[] {
  const base = [
    { label: '==', value: '==' },
    { label: '!=', value: '!=' },
    { label: 'isNull', value: 'isNull' },
    { label: 'isNotNull', value: 'isNotNull' },
  ]
  if (!type) {
    return [...base,
      { label: '>', value: '>' }, { label: '>=', value: '>=' },
      { label: '<', value: '<' }, { label: '<=', value: '<=' },
      { label: 'isEmpty', value: 'isEmpty' }, { label: 'isNotEmpty', value: 'isNotEmpty' },
    ]
  }
  switch (type) {
    case 'number':
      return [...base, { label: '>', value: '>' }, { label: '>=', value: '>=' }, { label: '<', value: '<' }, { label: '<=', value: '<=' }]
    case 'string':
      return [...base, { label: 'isEmpty', value: 'isEmpty' }, { label: 'isNotEmpty', value: 'isNotEmpty' }]
    case 'boolean':
      return base
    case 'array':
      return [
        { label: 'count ==', value: 'count ==' }, { label: 'count !=', value: 'count !=' },
        { label: 'count <',  value: 'count <'  }, { label: 'count <=', value: 'count <=' },
        { label: 'count >',  value: 'count >'  }, { label: 'count >=', value: 'count >=' },
        ...base
      ]
    case 'object':
    case 'null':
      return [...base, { label: 'isEmpty', value: 'isEmpty' }, { label: 'isNotEmpty', value: 'isNotEmpty' }]
    default:
      return base
  }
}

const availableComparators = computed(() => getComparatorsForType(leftType.value))

watchEffect(() => {
  if (props.node.type !== 'condition') return
  const allowed = availableComparators.value.map(c => c.value)
  if (props.node.comparator && !allowed.includes(props.node.comparator)) {
    handleUpdate({ comparator: '' })
  }
})

// ─── 列表过滤相关 ─────────────────────────────────────────────
function findFieldOption(path: string, options: FieldOption[]): FieldOption | null {
  for (const opt of options) {
    if (opt.value === path) return opt
    if (opt.children) {
      const found = findFieldOption(path, opt.children)
      if (found) return found
    }
  }
  return null
}

const currentArrayFieldOption = computed(() => {
  if (props.node.type !== 'condition' || props.node.left?.type !== 'field') return null
  return findFieldOption(props.node.left.path, fieldOptions.value)
})

const listElementType = computed(() => {
  const opt = currentArrayFieldOption.value
  if (opt?.type === 'array') return opt.elementType ?? 'number'
  return null
})

// 查找元素内部字段的类型
function findElementFieldType(path: string, children: FieldOption[]): string | undefined {
  for (const child of children) {
    if (child.value === path) return child.type
    if (child.children) {
      // 如果路径是级联的，需要支持深层查找（这里简单起见直接比较）
      // 本场景一般只一层，可扩展
      const found = findElementFieldType(path, child.children)
      if (found) return found
    }
  }
  return undefined
}

const selectedElementFieldType = computed(() => {
  const opt = currentArrayFieldOption.value
  const fieldPath = props.node.listFilter?.fieldPath
  if (!opt || !opt.elementChildren || !fieldPath) return undefined
  return findElementFieldType(fieldPath, opt.elementChildren)
})

const listFilterComparators = computed(() => {
  if (listElementType.value === 'object') {
    const fieldType = selectedElementFieldType.value
    if (!fieldType) return [] // 未选字段时不显示操作符
    return getComparatorsForType(fieldType)
  }
  // 基本类型直接使用元素类型
  return getComparatorsForType(listElementType.value)
})

const hasFilterValue = computed(() => {
  const comp = props.node.listFilter?.comparator
  if (!comp) return false
  return !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(comp)
})

// 当左侧字段改变时清空列表过滤
watch(() => props.node.left, () => {
  if (props.node.listFilter) {
    handleUpdate({ listFilter: undefined })
  }
})

function updateListFilter(partial: Partial<ListFilter>) {
  const current = props.node.listFilter || { comparator: '' }
  const updated = { ...current, ...partial }
  handleUpdate({ listFilter: updated })
}

function updateListFilterField(fieldPath: string) {
  updateListFilter({ fieldPath, comparator: '' }) // 切换字段时清空操作符和值
}

function updateListFilterComparator(comp: string) {
  const needsValue = !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(comp)
  const partial: Partial<ListFilter> = { comparator: comp }
  if (!needsValue) {
    partial.value = undefined
  } else if (!props.node.listFilter?.value) {
    // 根据当前字段类型初始化值字面量
    const valueType = listElementType.value === 'object'
      ? (selectedElementFieldType.value === 'number' ? 'number' as const : 'string' as const)
      : (listElementType.value === 'number' ? 'number' as const : 'string' as const)
    partial.value = { type: 'literal', value: '', literalType: valueType }
  }
  updateListFilter(partial)
}

function updateListFilterValue(val: string | number) {
  const valueType = listElementType.value === 'object'
    ? (selectedElementFieldType.value === 'number' ? 'number' as const : 'string' as const)
    : (listElementType.value === 'number' ? 'number' as const : 'string' as const)
  updateListFilter({ value: { type: 'literal', value: String(val ?? ''), literalType: valueType } })
}

// ─── 其他辅助 ──────────────────────────────────────────────
const isCountOperator = computed(() => props.node.comparator?.startsWith('count ') ?? false)
const hasValueInput = computed(() => {
  return !!props.node.comparator &&
    !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(props.node.comparator)
})

const isConfigured = computed(() => {
  if (props.node.type !== 'condition') return false
  return !!(props.node.left && props.node.comparator)
})

const summaryExpression = computed(() => {
  if (props.node.type !== 'condition') return { left: '', op: '', right: '' }
  let leftStr = formatExpression(props.node.left)
  // 列表过滤预览
  if (props.node.listFilter && props.node.listFilter.comparator) {
    const { comparator, fieldPath, value } = props.node.listFilter
    let target = '#this'
    if (fieldPath) target = `#this.${fieldPath}`
    switch (comparator) {
      case 'isEmpty':
        leftStr = `${leftStr}.?[${target} == null || ${target}.isEmpty()]`
        break
      case 'isNotEmpty':
        leftStr = `${leftStr}.?[${target} != null && !${target}.isEmpty()]`
        break
      case 'isNull':
        leftStr = `${leftStr}.?[${target} == null]`
        break
      case 'isNotNull':
        leftStr = `${leftStr}.?[${target} != null]`
        break
      default: {
        const filterVal = value ? formatExpression(value) : ''
        leftStr = `${leftStr}.?[${target} ${comparator} ${filterVal}]`
        break
      }
    }
  }
  const op = props.node.comparator ?? ''
  if (op.startsWith('count ')) {
    leftStr = `${leftStr}.size()`
  }
  return {
    left: leftStr,
    op,
    right: props.node.right ? formatExpression(props.node.right) : '',
  }
})

// ─── 事件处理 ──────────────────────────────────────────────
function handleOperatorChange(value: LogicalOperator) {
  handleUpdate({ operator: value })
}
function updateLeft(expr: Expression) { handleUpdate({ left: expr }) }
function updateRight(expr: Expression) { handleUpdate({ right: expr }) }
function updateComparator(value: string) { handleUpdate({ comparator: value }) }

function toggleEdit() { if (!props.disabled) isEditing.value = !isEditing.value }
function closeEdit() { isEditing.value = false }

// v-click-outside 指令
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.n-cascader-menu') || target.closest('.n-popover-shared') || target.closest('.v-binder-follower-content')) return
      if (!el.contains(target) && el !== target) binding.value(event)
    }
    ;(el as any).__clickOutsideHandler = handler
    document.addEventListener('click', handler, true)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).__clickOutsideHandler, true)
    delete (el as any).__clickOutsideHandler
  },
}

const listFilterLiteralValue = computed(() => {
  const val = props.node.listFilter?.value
  if (val && val.type === 'literal') {
    return val.value
  }
  return ''
})
</script>

<template>
  <!-- 条件行 -->
  <div
    v-if="node.type === 'condition'"
    v-click-outside="closeEdit"
    class="rounded-md border overflow-hidden transition-all duration-150"
    :class="[isEditing ? 'border-blue-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300', disabled ? 'opacity-60 pointer-events-none' : '']"
  >
    <!-- 摘要行 -->
    <div class="group/row flex items-center gap-1.5 px-2.5 min-h-[34px] cursor-pointer select-none overflow-hidden" @click="toggleEdit">
      <span class="i-carbon:rule text-[11px] text-gray-300 flex-shrink-0" />
      <template v-if="isConfigured">
        <span class="expr-chip expr-chip--field font-mono text-[11px] flex-1 min-w-0">{{ summaryExpression.left || '?' }}</span>
        <span v-if="summaryExpression.op" class="expr-chip expr-chip--op text-[11px] font-semibold flex-shrink-0">{{ summaryExpression.op }}</span>
        <span v-if="summaryExpression.right" class="expr-chip expr-chip--val font-mono text-[11px] flex-1 min-w-0">{{ summaryExpression.right }}</span>
        <span v-else-if="hasValueInput" class="text-[11px] text-gray-300 tracking-widest">···</span>
      </template>
      <span v-else class="text-xs text-gray-300 italic">点击配置条件…</span>
      <n-button class="!ml-auto opacity-0 group-hover/row:opacity-100 transition-opacity duration-100 flex-shrink-0" text size="tiny" type="error" :disabled="disabled" @click.stop="handleRemove">
        <template #icon><span class="i-carbon:close text-xs" /></template>
      </n-button>
    </div>

    <!-- 编辑面板 -->
    <Transition name="slide-down">
      <div v-if="isEditing" class="border-t border-gray-100 bg-gray-50/80 px-3 py-3 space-y-2" @click.stop>
        <div class="flex items-start gap-2 flex-wrap">
          <!-- 左侧表达式 -->
          <div class="expr-block">
            <div class="expr-block__label">左侧</div>
            <div class="expr-block__body">
              <ExpressionEditor :model-value="node.left ?? { type: 'field', path: '' }" :field-options="fieldOptions" :disabled="disabled" :allow-literal="false" @update:model-value="updateLeft" />
            </div>
          </div>
          <!-- 操作符 -->
          <div class="expr-block">
            <div class="expr-block__label">操作符</div>
            <div class="expr-block__body">
              <n-select :value="node.comparator" :options="availableComparators" placeholder="…" :disabled="disabled" size="small" class="!w-[108px]" @update:value="updateComparator" />
            </div>
          </div>
          <!-- 右侧表达式 -->
          <div v-if="hasValueInput" class="expr-block">
            <div class="expr-block__label">右侧</div>
            <div class="expr-block__body">
              <ExpressionEditor v-if="isCountOperator" :model-value="node.right ?? { type: 'literal', value: '', literalType: 'number' }" :force-number-input="true" :disabled="disabled" @update:model-value="updateRight" />
              <ExpressionEditor v-else :model-value="node.right ?? { type: 'literal', value: '', literalType: 'string' }" :field-options="fieldOptions" :disabled="disabled" :allow-literal="true" @update:model-value="updateRight" />
            </div>
          </div>
        </div>

        <!-- 列表过滤区块（仅当左侧为数组时显示） -->
        <div v-if="leftType === 'array'" class="flex items-start gap-2 flex-wrap">
          <div class="expr-block">
            <div class="expr-block__label">列表过滤</div>
            <div class="expr-block__body">
              <!-- 基本类型：直接 #this -->
              <template v-if="listElementType !== 'object'">
                <span class="text-xs text-gray-500 mr-1">#this</span>
                <n-select
                  :value="node.listFilter?.comparator ?? ''"
                  :options="listFilterComparators"
                  placeholder="操作符"
                  size="small"
                  class="!w-[80px]"
                  :disabled="disabled"
                  @update:value="updateListFilterComparator"
                />
                <template v-if="hasFilterValue">
                  <n-input-number
                    v-if="listElementType === 'number'"
                    :value="listFilterLiteralValue !== '' ? Number(listFilterLiteralValue) : null"
                    size="small"
                    class="!w-[100px]"
                    :disabled="disabled"
                    @update:value="(v: number | null) => updateListFilterValue(v ?? 0)"
                  />
                  <n-input
                    v-else
                    :value="listFilterLiteralValue"
                    size="small"
                    class="!w-[120px]"
                    :disabled="disabled"
                    placeholder="文本…"
                    @update:value="(v: string) => updateListFilterValue(v)"
                  />
                </template>
              </template>
              <!-- 对象类型：字段选择 + 操作符 + 值 -->
              <template v-else>
                <span class="text-xs text-gray-500 mr-1">#this.</span>
                <n-cascader
                  :value="node.listFilter?.fieldPath"
                  :options="currentArrayFieldOption?.elementChildren ?? []"
                  placeholder="选择字段"
                  size="small"
                  class="!w-[140px]"
                  :disabled="disabled"
                  check-strategy="child"
                  @update:value="updateListFilterField"
                />
                <n-select
                  v-if="selectedElementFieldType"
                  :value="node.listFilter?.comparator ?? ''"
                  :options="listFilterComparators"
                  placeholder="操作符"
                  size="small"
                  class="!w-[80px]"
                  :disabled="disabled"
                  @update:value="updateListFilterComparator"
                />
                <template v-if="hasFilterValue && selectedElementFieldType">
                  <n-input-number
                    v-if="selectedElementFieldType === 'number'"
                    :value="listFilterLiteralValue !== '' ? Number(listFilterLiteralValue) : null"
                    size="small"
                    class="!w-[100px]"
                    :disabled="disabled"
                    @update:value="(v: number | null) => updateListFilterValue(v ?? 0)"
                  />
                  <n-input
                    v-else
                    :value="listFilterLiteralValue"
                    size="small"
                    class="!w-[120px]"
                    :disabled="disabled"
                    placeholder="文本…"
                    @update:value="(v: string) => updateListFilterValue(v)"
                  />
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div v-if="isConfigured" class="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white border border-gray-100">
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

  <!-- 分组节点（保持不变） -->
  <div v-else class="relative" :class="level > 0 ? 'ml-4' : ''">
    <div v-if="level > 0" class="group-connector" />
    <div class="flex items-center gap-2 mb-2">
      <div class="op-toggle">
        <button v-for="opt in logicalOperatorOptions" :key="opt.value" class="op-toggle__btn" :class="{
          'op-toggle__btn--and': currentOperator === 'and' && opt.value === 'and',
          'op-toggle__btn--or':  currentOperator === 'or'  && opt.value === 'or',
          'op-toggle__btn--not': currentOperator === 'not' && opt.value === 'not',
          'op-toggle__btn--off': currentOperator !== opt.value,
        }" :disabled="disabled" @click="handleOperatorChange(opt.value as LogicalOperator)">{{ opt.label }}</button>
      </div>
      <div class="flex-1" />
      <div class="flex items-center gap-1">
        <n-button size="small" :disabled="disabled" @click="handleAddCondition"><template #icon><span class="i-carbon:add text-xs" /></template>条件</n-button>
        <n-button size="small" :disabled="disabled" @click="handleAddGroup"><template #icon><span class="i-carbon:folder-add text-xs" /></template>分组</n-button>
        <template v-if="level > 0">
          <div class="w-px h-4 bg-gray-200 mx-0.5" />
          <n-button size="small" quaternary circle type="error" :disabled="disabled" @click="handleRemove"><template #icon><span class="i-carbon:trash-can text-sm" /></template></n-button>
        </template>
      </div>
    </div>
    <div class="relative pl-5">
      <div v-if="node.children && node.children.length > 0" class="group-vline" />
      <div class="flex flex-col gap-1.5">
        <template v-if="node.children && node.children.length > 0">
          <div v-for="child in node.children" :key="child.id" class="relative">
            <div class="group-hline" />
            <RuleTreeNode :node="child" :authentication="authentication" :principal="principal" :locals="locals" :disabled="disabled" :level="level + 1"
              @add-condition="(id) => $emit('add-condition', id)" @add-group="(id) => $emit('add-group', id)"
              @remove-node="(id) => $emit('remove-node', id)" @update-node="(id, updates) => $emit('update-node', id, updates)" />
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
/* 保留原有的所有样式 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: max-height 0.2s ease, opacity 0.15s ease;
  max-height: 400px; overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to { max-height: 0; opacity: 0; }
.expr-chip {
  display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.expr-chip--field { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.expr-chip--op    { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; }
.expr-chip--val   { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.expr-block { display: flex; flex-direction: column; gap: 4px; }
.expr-block__label { font-size: 10px; color: #9ca3af; padding-left: 2px; letter-spacing: 0.3px; }
.expr-block__body {
  display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  padding: 5px 8px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; min-height: 36px;
}
.op-toggle { display: inline-flex; border: 1px solid #d1d5db; border-radius: 5px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
.op-toggle__btn { padding: 0 12px; height: 26px; font-size: 12px; font-weight: 600; border: none; border-right: 1px solid #e5e7eb; background: #ffffff; color: #6b7280; cursor: pointer; transition: background 0.1s, color 0.1s; }
.op-toggle__btn:last-child { border-right: none; }
.op-toggle__btn:disabled { cursor: not-allowed; opacity: 0.5; }
.op-toggle__btn--off:not(:disabled):hover { background: #f9fafb; color: #374151; }
.op-toggle__btn--and { background: #1d4ed8; color: #ffffff; }
.op-toggle__btn--or  { background: #d97706; color: #ffffff; }
.op-toggle__btn--not { background: #dc2626; color: #ffffff; }
.group-vline { position: absolute; left: 7px; top: 0; bottom: 12px; width: 1px; background: #e5e7eb; }
.group-hline { position: absolute; left: -13px; top: 17px; width: 13px; height: 1px; background: #e5e7eb; }
.group-connector { position: absolute; left: -9px; top: 17px; width: 9px; height: 1px; background: #e5e7eb; }
</style>
