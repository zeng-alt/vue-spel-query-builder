<script setup lang="ts">
import { computed, ref, watchEffect, watch } from 'vue'
import type { DirectiveBinding } from 'vue'
import type {
  RuleNode,
  FieldOption,
  LogicalOperator,
  Expression,
  ListFilter,
  ComponentSize,
} from '../../types'
import ExpressionEditor from './ExpressionEditor.vue'
import { formatExpression } from '../../utils'
import { spelService } from '../../spel-service'
import { useSpelI18n } from '../../composables'

const props = withDefaults(
  defineProps<{
    node: RuleNode
    authentication?: Record<string, unknown>
    principal?: Record<string, unknown>
    locals?: Record<string, unknown>
    globals?: Record<string, unknown>
    methods?: import('../../types').CustomMethod[]
    disabled?: boolean
    level?: number
    theme?: 'light' | 'dark'
    size?: ComponentSize
  }>(),
  {
    theme: 'light',
    size: 'small',
  },
)

const emit = defineEmits<{
  (e: 'add-condition', id: string): void
  (e: 'add-group', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'update-node', id: string, updates: Partial<RuleNode>): void
}>()

const { t } = useSpelI18n()

const level = props.level ?? 0
const isEditing = ref(false)

const handleAddCondition = () => emit('add-condition', props.node.id)
const handleAddGroup = () => emit('add-group', props.node.id)
const handleRemove = () => emit('remove-node', props.node.id)

function handleUpdate(updates: Partial<RuleNode>) {
  emit('update-node', props.node.id, updates)
}

// ─── 尺寸工具类（替代原 .size--* 后代选择器）─────────────────────────────
const SIZES = {
  tiny: {
    row: 'min-h-[28px] px-1.5',
    panel: 'py-1.5 px-2',
    body: 'px-1.5 py-[3px] min-h-[28px]',
    label: 'text-[9px]',
    chip: 'px-1 text-[10px]',
    toggleBtn: 'px-2 h-[22px] text-[11px]',
    actionBtn: '!text-[11px]',
    preview: 'px-1.5 py-1',
    previewCode: 'text-[10px]',
    empty: 'py-3',
    emptyP: 'text-[10px]',
  },
  small: {
    row: 'min-h-[34px] px-2.5',
    panel: 'p-3',
    body: 'px-2 py-[5px] min-h-[36px]',
    label: 'text-[10px]',
    chip: 'px-1.5 py-[1px] text-[11px]',
    toggleBtn: 'px-3 h-[26px] text-[12px]',
    actionBtn: '',
    preview: 'px-2 py-1.5',
    previewCode: 'text-[11px]',
    empty: 'py-6',
    emptyP: 'text-[11px]',
  },
  medium: {
    row: 'min-h-[40px] px-3.5',
    panel: 'p-4',
    body: 'px-3 py-2 min-h-[44px]',
    label: 'text-[11px]',
    chip: 'px-2 py-0.5 text-[12px]',
    toggleBtn: 'px-4 h-[30px] text-[13px]',
    actionBtn: '',
    preview: 'px-3 py-2',
    previewCode: 'text-[12px]',
    empty: 'py-8',
    emptyP: 'text-[12px]',
  },
  large: {
    row: 'min-h-[48px] px-4.5',
    panel: 'p-5',
    body: 'px-4 py-2.5 min-h-[52px]',
    label: 'text-[12px]',
    chip: 'px-2.5 py-[3px] text-[13px]',
    toggleBtn: 'px-5 h-[34px] text-[14px]',
    actionBtn: '',
    preview: 'px-4 py-2.5',
    previewCode: 'text-[13px]',
    empty: 'py-10',
    emptyP: 'text-[13px]',
  },
} as const

const s = computed(() => SIZES[props.size])

// ─── 复用的工具类片段 ──────────────────────────────────────────────────
const exprBlock = 'flex flex-col gap-1'
const exprBlockLabel = 'pl-0.5 text-[color:var(--expr-block-label)] tracking-[0.3px]'
const exprBlockBody =
  'flex items-center gap-1 flex-wrap bg-[var(--expr-block-body-bg)] border border-solid border-[var(--expr-block-body-border)] rounded-[6px]'
const chipBase =
  'inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis rounded border border-solid'
const toggleBtnBase =
  'cursor-pointer font-semibold [border-style:solid] [border-top-width:0] [border-bottom-width:0] [border-left-width:0] border-r border-r-[var(--op-toggle-btn-border)] last:border-r-0 transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50'
const actionBtnClass =
  '!bg-[#7c3aed] !border-[#7c3aed] !text-white transition-all duration-200 hover:!bg-[#6d28d9] hover:!border-[#6d28d9] hover:!shadow-[0_2px_8px_rgba(124,58,237,0.28)] active:!bg-[#5b21b6] active:!border-[#5b21b6] disabled:!opacity-50 disabled:!shadow-none'

// ─── 字段树构建（包含对象元素的内部字段）───────────────────────────
const fieldOptions = computed<FieldOption[]>(() => {
  const result: FieldOption[] = []
  if (props.authentication)
    result.push(...buildFieldOptions(props.authentication, 'authentication'))
  if (props.principal) result.push(...buildFieldOptions(props.principal, 'principal'))
  if (props.locals) result.push(...buildFieldOptions(props.locals, '#'))
  if (props.globals) result.push(...buildFieldOptions(props.globals))
  return result
})

function buildFieldOptions(obj: Record<string, unknown>, prefix = ''): FieldOption[] {
  const options: FieldOption[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? (prefix === '#' ? `#${key}` : `${prefix}.${key}`) : key
    if (Array.isArray(value)) {
      const elementType = value.length > 0 ? typeof value[0] : 'number'
      const option: FieldOption = { label: key, value: fullPath, type: 'array', elementType }
      const first = value[0]
      if (elementType === 'object' && first && typeof first === 'object' && !Array.isArray(first)) {
        option.elementChildren = buildFieldOptions(first as Record<string, unknown>, '') // 取第一个元素构建子字段
      }
      options.push(option)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      options.push({
        label: key,
        value: fullPath,
        type: 'object',
        children: buildFieldOptions(value as Record<string, unknown>, fullPath),
      })
    } else {
      options.push({ label: key, value: fullPath, type: typeof value })
    }
  }
  return options
}

// ─── 逻辑分组操作符：且/或为单选组，非为独立取反开关 ──────────────────
const logicalOperatorOptions = computed(() => [
  { label: t('ruleTree.group.and'), value: 'and' },
  { label: t('ruleTree.group.or'), value: 'or' },
])
// 兼容旧数据 operator === 'not'：视为 且 + 取反
const currentOperator = computed(() => (props.node.operator === 'or' ? 'or' : 'and'))
const currentNegate = computed(() => props.node.negate === true || props.node.operator === 'not')

function opBtnClass(value: string) {
  if (currentOperator.value !== value) {
    return 'bg-[var(--op-toggle-btn-bg)] text-[color:var(--op-toggle-btn-fg)] hover:bg-[var(--op-toggle-btn-hover-bg)] hover:text-[color:var(--op-toggle-btn-hover-fg)] disabled:hover:bg-[var(--op-toggle-btn-bg)] disabled:hover:text-[color:var(--op-toggle-btn-fg)]'
  }
  return value === 'or'
    ? 'bg-[var(--op-toggle-or-bg)] text-[color:var(--op-toggle-active-fg)]'
    : 'bg-[var(--op-toggle-and-bg)] text-[color:var(--op-toggle-active-fg)]'
}

const negateBtnClass = computed(() =>
  currentNegate.value
    ? 'bg-[var(--op-toggle-not-bg)] text-[color:var(--op-toggle-active-fg)]'
    : 'bg-[var(--op-toggle-btn-bg)] text-[color:var(--op-toggle-btn-fg)] hover:bg-[var(--op-toggle-btn-hover-bg)] hover:text-[color:var(--op-toggle-btn-hover-fg)] disabled:hover:bg-[var(--op-toggle-btn-bg)] disabled:hover:text-[color:var(--op-toggle-btn-fg)]',
)

// ─── 运行时类型检测 ──────────────────────────────────────────
function getDetailedType(val: unknown): string {
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
  if (!exprStr) {
    leftType.value = null
    return
  }
  try {
    spelService.setContext(props.authentication, props.principal, props.globals)
    const result = spelService.eval(exprStr, props.locals)
    leftType.value = getDetailedType(result)
  } catch {
    leftType.value = null
  }
})

// ─── 通用操作符生成函数 ──────────────────────────────────────
const comparatorLabelMap: Record<string, string> = {
  '==': 'comparators.eq',
  '!=': 'comparators.ne',
  '>': 'comparators.gt',
  '>=': 'comparators.gte',
  '<': 'comparators.lt',
  '<=': 'comparators.lte',
  contains: 'comparators.contains',
  startsWith: 'comparators.startsWith',
  endsWith: 'comparators.endsWith',
  matches: 'comparators.matches',
  in: 'comparators.in',
  'not in': 'comparators.notIn',
  isEmpty: 'comparators.isEmpty',
  isNotEmpty: 'comparators.isNotEmpty',
  isNull: 'comparators.isNull',
  isNotNull: 'comparators.isNotNull',
  'count ==': 'comparators.countEq',
  'count !=': 'comparators.countNe',
  'count <': 'comparators.countLt',
  'count <=': 'comparators.countLte',
  'count >': 'comparators.countGt',
  'count >=': 'comparators.countGte',
}

function getComparatorLabel(value: string): string {
  return t(comparatorLabelMap[value] ?? `comparators.${value}`)
}

function getComparatorsForType(type: string | null): { label: string; value: string }[] {
  const base = [
    { label: getComparatorLabel('=='), value: '==' },
    { label: getComparatorLabel('!='), value: '!=' },
    { label: getComparatorLabel('isNull'), value: 'isNull' },
    { label: getComparatorLabel('isNotNull'), value: 'isNotNull' },
  ]
  if (!type) {
    return [
      ...base,
      { label: getComparatorLabel('>'), value: '>' },
      { label: getComparatorLabel('>='), value: '>=' },
      { label: getComparatorLabel('<'), value: '<' },
      { label: getComparatorLabel('<='), value: '<=' },
      { label: getComparatorLabel('isEmpty'), value: 'isEmpty' },
      { label: getComparatorLabel('isNotEmpty'), value: 'isNotEmpty' },
    ]
  }
  switch (type) {
    case 'number':
      return [
        ...base,
        { label: getComparatorLabel('>'), value: '>' },
        { label: getComparatorLabel('>='), value: '>=' },
        { label: getComparatorLabel('<'), value: '<' },
        { label: getComparatorLabel('<='), value: '<=' },
      ]
    case 'string':
      return [
        ...base,
        { label: getComparatorLabel('isEmpty'), value: 'isEmpty' },
        { label: getComparatorLabel('isNotEmpty'), value: 'isNotEmpty' },
      ]
    case 'boolean':
      return base
    case 'array':
      return [
        { label: getComparatorLabel('count =='), value: 'count ==' },
        { label: getComparatorLabel('count !='), value: 'count !=' },
        { label: getComparatorLabel('count <'), value: 'count <' },
        { label: getComparatorLabel('count <='), value: 'count <=' },
        { label: getComparatorLabel('count >'), value: 'count >' },
        { label: getComparatorLabel('count >='), value: 'count >=' },
        ...base,
      ]
    case 'object':
    case 'null':
      return [
        ...base,
        { label: getComparatorLabel('isEmpty'), value: 'isEmpty' },
        { label: getComparatorLabel('isNotEmpty'), value: 'isNotEmpty' },
      ]
    default:
      return base
  }
}

const availableComparators = computed(() => getComparatorsForType(leftType.value))

watchEffect(() => {
  if (props.node.type !== 'condition') return
  const allowed = availableComparators.value.map((c) => c.value)
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

// 当左侧字段路径改变时清空列表过滤/投影（忽略引用变化，仅当路径值变化时触发）
watch(
  () => {
    const left = props.node.left
    return left?.type === 'field' ? left.path : null
  },
  (newPath, oldPath) => {
    if (oldPath && newPath !== oldPath && props.node.listFilter) {
      handleUpdate({ listFilter: undefined })
    }
  },
)

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
    const valueType =
      listElementType.value === 'object'
        ? selectedElementFieldType.value === 'number'
          ? ('number' as const)
          : ('string' as const)
        : listElementType.value === 'number'
          ? ('number' as const)
          : ('string' as const)
    partial.value = { type: 'literal', value: '', literalType: valueType }
  }
  updateListFilter(partial)
}

function updateListFilterValue(val: string | number) {
  const valueType =
    listElementType.value === 'object'
      ? selectedElementFieldType.value === 'number'
        ? ('number' as const)
        : ('string' as const)
      : listElementType.value === 'number'
        ? ('number' as const)
        : ('string' as const)
  updateListFilter({ value: { type: 'literal', value: String(val ?? ''), literalType: valueType } })
}

// ─── 其他辅助 ──────────────────────────────────────────────
const isCountOperator = computed(() => props.node.comparator?.startsWith('count ') ?? false)
const hasValueInput = computed(() => {
  return (
    !!props.node.comparator &&
    !['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(props.node.comparator)
  )
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
  // 兼容旧数据 operator === 'not'：切换且/或时保留取反
  const updates: Partial<RuleNode> = { operator: value }
  if (props.node.operator === 'not') updates.negate = true
  handleUpdate(updates)
}

function handleNegateToggle() {
  const updates: Partial<RuleNode> = { negate: !currentNegate.value }
  if (props.node.operator === 'not') updates.operator = 'and'
  handleUpdate(updates)
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

interface ClickOutsideElement extends HTMLElement {
  __clickOutsideHandler?: (event: MouseEvent) => void
}

// v-click-outside 指令
const vClickOutside = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding<(event: MouseEvent) => void>) {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (
        target.closest('.n-cascader-menu') ||
        target.closest('.n-popover-shared') ||
        target.closest('.v-binder-follower-content')
      )
        return
      if (!el.contains(target) && el !== target) binding.value(event)
    }
    el.__clickOutsideHandler = handler
    document.addEventListener('click', handler, true)
  },
  unmounted(el: ClickOutsideElement) {
    if (el.__clickOutsideHandler) {
      document.removeEventListener('click', el.__clickOutsideHandler, true)
      delete el.__clickOutsideHandler
    }
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
    class="rounded-[6px] border border-solid overflow-hidden transition-all duration-150 bg-[var(--card-bg)]"
    :class="[
      isEditing
        ? 'border-[var(--card-border-editing)] shadow-[var(--card-shadow-editing)]'
        : 'border-[var(--card-border-idle)] hover:border-[var(--card-border-hover)]',
      disabled ? 'opacity-60 pointer-events-none' : '',
    ]"
  >
    <!-- 摘要行 -->
    <div
      class="group/row flex items-center gap-1.5 cursor-pointer select-none overflow-hidden"
      :class="s.row"
      @click="toggleEdit"
    >
      <span class="i-carbon:rule" />
      <template v-if="isConfigured">
        <span
          :class="[
            chipBase,
            'bg-[var(--expr-field-bg)] text-[color:var(--expr-field-fg)] border-[var(--expr-field-border)] font-mono flex-1 min-w-0',
            s.chip,
          ]"
          >{{ summaryExpression.left || '?' }}</span
        >
        <span
          v-if="summaryExpression.op"
          :class="[
            chipBase,
            'bg-[var(--expr-op-bg)] text-[color:var(--expr-op-fg)] border-[var(--expr-op-border)] font-semibold flex-shrink-0',
            s.chip,
          ]"
          >{{ summaryExpression.op }}</span
        >
        <span
          v-if="summaryExpression.right"
          :class="[
            chipBase,
            'bg-[var(--expr-val-bg)] text-[color:var(--expr-val-fg)] border-[var(--expr-val-border)] font-mono flex-1 min-w-0',
            s.chip,
          ]"
          >{{ summaryExpression.right }}</span
        >
        <span
          v-else-if="hasValueInput"
          class="text-[11px] tracking-widest text-[color:var(--text-placeholder)]"
          >···</span
        >
      </template>
      <span v-else class="text-xs italic text-[color:var(--text-placeholder)]">{{
        t('ruleTree.condition.empty')
      }}</span>
      <n-button
        class="!ml-auto opacity-0 group-hover/row:opacity-100 transition-opacity duration-100 flex-shrink-0"
        text
        :size="size"
        type="error"
        :disabled="disabled"
        @click.stop="handleRemove"
      >
        <template #icon><span class="i-carbon:delete text-14" /></template>
      </n-button>
    </div>

    <!-- 编辑面板 -->
    <Transition
      enter-active-class="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[400px]"
      leave-active-class="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
      leave-from-class="max-h-[400px]"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="isEditing"
        class="border-t border-solid border-[var(--edit-panel-border)] bg-[var(--edit-panel-bg)] space-y-2"
        :class="s.panel"
        @click.stop
      >
        <div class="flex items-start gap-2 flex-wrap">
          <!-- 左侧表达式 -->
          <div :class="exprBlock">
            <div :class="[exprBlockLabel, s.label]">{{ t('ruleTree.condition.left') }}</div>
            <div :class="[exprBlockBody, s.body]">
              <ExpressionEditor
                :model-value="node.left ?? { type: 'field', path: '' }"
                :field-options="fieldOptions"
                :methods="methods"
                :disabled="disabled"
                :allow-literal="false"
                :size="size"
                @update:model-value="updateLeft"
              />
            </div>
          </div>
          <!-- 操作符 -->
          <div :class="exprBlock">
            <div :class="[exprBlockLabel, s.label]">{{ t('ruleTree.condition.operator') }}</div>
            <div :class="[exprBlockBody, s.body]">
              <n-select
                :value="node.comparator"
                :options="availableComparators"
                placeholder="…"
                :disabled="disabled"
                :size="size"
                class="!w-max !min-w-[90px] !max-w-[220px]"
                @update:value="updateComparator"
              />
            </div>
          </div>
          <!-- 右侧表达式 -->
          <div v-if="hasValueInput" :class="exprBlock">
            <div :class="[exprBlockLabel, s.label]">{{ t('ruleTree.condition.right') }}</div>
            <div :class="[exprBlockBody, s.body]">
              <ExpressionEditor
                v-if="isCountOperator"
                :model-value="node.right ?? { type: 'literal', value: '', literalType: 'number' }"
                :force-number-input="true"
                :disabled="disabled"
                :size="size"
                @update:model-value="updateRight"
              />
              <ExpressionEditor
                v-else
                :model-value="node.right ?? { type: 'literal', value: '', literalType: 'string' }"
                :field-options="fieldOptions"
                :methods="methods"
                :disabled="disabled"
                :allow-literal="true"
                :size="size"
                @update:model-value="updateRight"
              />
            </div>
          </div>
        </div>

        <!-- 列表区块（仅当左侧为数组时显示）：对象数组 + ==/!= 显示投影，否则显示过滤 -->
        <div v-if="leftType === 'array'" class="flex items-start gap-2 flex-wrap">
          <div :class="exprBlock">
            <div :class="[exprBlockLabel, s.label]">{{ t('ruleTree.condition.listFilter') }}</div>
            <div :class="[exprBlockBody, s.body]">
              <!-- 基本类型：直接 #this -->
              <template v-if="listElementType !== 'object'">
                <span class="text-xs mr-1 text-[color:var(--text-secondary)]">#this</span>
                <n-select
                  :value="node.listFilter?.comparator ?? ''"
                  :options="listFilterComparators"
                  :placeholder="t('ruleTree.condition.placeholder.operator')"
                  :size="size"
                  class="!w-max !min-w-[90px] !max-w-[220px]"
                  :disabled="disabled"
                  @update:value="updateListFilterComparator"
                />
                <template v-if="hasFilterValue">
                  <n-input-number
                    v-if="listElementType === 'number'"
                    :value="listFilterLiteralValue !== '' ? Number(listFilterLiteralValue) : null"
                    :size="size"
                    class="!w-[100px]"
                    :disabled="disabled"
                    @update:value="(v: number | null) => updateListFilterValue(v ?? 0)"
                  />
                  <n-input
                    v-else
                    :value="listFilterLiteralValue"
                    :size="size"
                    class="!w-[120px]"
                    :disabled="disabled"
                    :placeholder="t('ruleTree.condition.placeholder.text')"
                    @update:value="(v: string) => updateListFilterValue(v)"
                  />
                </template>
              </template>
              <!-- 对象类型过滤：字段选择 + 操作符 + 值 -->
              <template v-else>
                <span class="text-xs mr-1 text-[color:var(--text-secondary)]">#this.</span>
                <n-cascader
                  :value="node.listFilter?.fieldPath"
                  :options="currentArrayFieldOption?.elementChildren ?? []"
                  :placeholder="t('ruleTree.condition.placeholder.field')"
                  :size="size"
                  class="!w-max !min-w-[90px] !max-w-[220px]"
                  :disabled="disabled"
                  check-strategy="child"
                  @update:value="updateListFilterField"
                />
                <n-select
                  v-if="selectedElementFieldType"
                  :value="node.listFilter?.comparator ?? ''"
                  :options="listFilterComparators"
                  :placeholder="t('ruleTree.condition.placeholder.operator')"
                  :size="size"
                  class="!w-max !min-w-[90px] !max-w-[220px]"
                  :disabled="disabled"
                  @update:value="updateListFilterComparator"
                />
                <template v-if="hasFilterValue && selectedElementFieldType">
                  <n-input-number
                    v-if="selectedElementFieldType === 'number'"
                    :value="listFilterLiteralValue !== '' ? Number(listFilterLiteralValue) : null"
                    :size="size"
                    class="!w-[100px]"
                    :disabled="disabled"
                    @update:value="(v: number | null) => updateListFilterValue(v ?? 0)"
                  />
                  <n-input
                    v-else
                    :value="listFilterLiteralValue"
                    :size="size"
                    class="!w-[120px]"
                    :disabled="disabled"
                    :placeholder="t('ruleTree.condition.placeholder.text')"
                    @update:value="(v: string) => updateListFilterValue(v)"
                  />
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div
          v-if="isConfigured"
          class="flex items-center gap-1.5 rounded bg-[var(--preview-bg)] border border-solid border-[var(--preview-border)]"
          :class="s.preview"
        >
          <span class="i-carbon:code text-xs flex-shrink-0 text-[color:var(--icon-muted)]" />
          <code class="leading-none text-[color:var(--preview-text)]" :class="s.previewCode">
            <span class="text-[color:var(--preview-left)]">{{
              summaryExpression.left || '…'
            }}</span>
            <span v-if="summaryExpression.op" class="mx-1 text-[color:var(--preview-op)]">{{
              summaryExpression.op
            }}</span>
            <span v-if="summaryExpression.right" class="text-[color:var(--preview-right)]">{{
              summaryExpression.right
            }}</span>
          </code>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 分组节点 -->
  <div v-else class="relative" :class="level > 0 ? 'ml-4' : ''">
    <div
      v-if="level > 0"
      class="absolute -left-[9px] top-[17px] w-[9px] h-px bg-[var(--connector-color)]"
    />
    <div class="flex items-center gap-2 mb-2">
      <div class="flex items-center gap-1.5">
        <div
          class="inline-flex rounded-[5px] overflow-hidden border border-solid border-[var(--op-toggle-border)] shadow-[var(--op-toggle-shadow)]"
        >
          <button
            v-for="opt in logicalOperatorOptions"
            :key="opt.value"
            :class="[toggleBtnBase, s.toggleBtn, opBtnClass(opt.value)]"
            :disabled="disabled"
            @click="handleOperatorChange(opt.value as LogicalOperator)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          :class="[toggleBtnBase, s.toggleBtn, negateBtnClass]"
          :disabled="disabled"
          @click="handleNegateToggle"
        >
          {{ t('ruleTree.group.not') }}
        </button>
      </div>
      <div class="flex-1" />
      <div class="flex items-center gap-1">
        <n-button
          :class="[actionBtnClass, s.actionBtn]"
          :size="size"
          :disabled="disabled"
          @click="handleAddCondition"
          ><template #icon><span class="i-carbon:add text-14" /></template
          >{{ t('ruleTree.group.addCondition') }}</n-button
        >
        <n-button
          :class="[actionBtnClass, s.actionBtn]"
          :size="size"
          :disabled="disabled"
          @click="handleAddGroup"
          ><template #icon><span class="i-carbon:folder-add text-14" /></template
          >{{ t('ruleTree.group.addGroup') }}</n-button
        >
        <template v-if="level > 0">
          <div class="w-px h-4 mx-0.5 bg-[var(--divider-bg)]" />
          <n-button
            :size="size"
            quaternary
            circle
            type="error"
            :disabled="disabled"
            @click="handleRemove"
            ><template #icon><span class="i-carbon:trash-can text-14" /></template
          ></n-button>
        </template>
      </div>
    </div>
    <div class="relative pl-5">
      <div
        v-if="node.children && node.children.length > 0"
        class="absolute left-[7px] top-0 bottom-3 w-px bg-[var(--connector-color)]"
      />
      <div class="flex flex-col gap-1.5">
        <template v-if="node.children && node.children.length > 0">
          <div v-for="child in node.children" :key="child.id" class="relative">
            <div
              class="absolute -left-[13px] top-[17px] w-[13px] h-px bg-[var(--connector-color)]"
            />
            <RuleTreeNode
              :node="child"
              :authentication="authentication"
              :principal="principal"
              :locals="locals"
              :globals="globals"
              :methods="methods"
              :disabled="disabled"
              :level="level + 1"
              :theme="props.theme"
              :size="size"
              @add-condition="(id) => $emit('add-condition', id)"
              @add-group="(id) => $emit('add-group', id)"
              @remove-node="(id) => $emit('remove-node', id)"
              @update-node="(id, updates) => $emit('update-node', id, updates)"
            />
          </div>
        </template>
        <div
          v-else
          class="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-[var(--empty-border)] text-[color:var(--empty-fg)]"
          :class="s.empty"
        >
          <span class="i-carbon:add-alt text-36 text-xl mb-1 text-[color:var(--icon-muted)]" />
          <p :class="['text-[color:var(--text-placeholder)]', s.emptyP]">
            {{ t('ruleTree.group.empty') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
