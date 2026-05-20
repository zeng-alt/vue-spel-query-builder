<script setup lang="ts">
import { computed } from 'vue'
import type { Expression, FunctionCall, FunctionDef, FieldOption } from '../../types'

// ─── 扩展的函数定义（增加 returnType） ────────────────────────

const FUNCTIONS: FunctionDef[] = [
  // 有调用方
  { label: 'length()',      value: 'length',      argumentCount: 0, hasBase: true, baseType: 'string', returnType: 'number' },
  { label: 'size()',        value: 'size',        argumentCount: 0, hasBase: true, baseType: 'collection', returnType: 'number' },
  { label: 'toUpperCase()', value: 'toUpperCase', argumentCount: 0, hasBase: true, baseType: 'string', returnType: 'string' },
  { label: 'toLowerCase()', value: 'toLowerCase', argumentCount: 0, hasBase: true, baseType: 'string', returnType: 'string' },
  { label: 'trim()',        value: 'trim',        argumentCount: 0, hasBase: true, baseType: 'string', returnType: 'string' },
  { label: 'abs()',         value: 'abs',         argumentCount: 0, hasBase: true, baseType: 'number', returnType: 'number' },
  { label: 'round()',       value: 'round',       argumentCount: 0, hasBase: true, baseType: 'number', returnType: 'number' },
  { label: 'startsWith()',  value: 'startsWith',  argumentCount: 1, hasBase: true, baseType: 'string', returnType: 'boolean' },
  { label: 'endsWith()',    value: 'endsWith',    argumentCount: 1, hasBase: true, baseType: 'string', returnType: 'boolean' },
  { label: 'contains()',    value: 'contains',    argumentCount: 1, hasBase: true, baseType: 'string', returnType: 'boolean' },
  { label: 'indexOf()',     value: 'indexOf',     argumentCount: 1, hasBase: true, baseType: 'string', returnType: 'number' },
  { label: 'charAt()',      value: 'charAt',      argumentCount: 1, hasBase: true, baseType: 'string', returnType: 'string' },
  // 独立函数
  { label: 'now()',         value: 'now',         argumentCount: 0, hasBase: false, returnType: 'date' },
  { label: 'random()',      value: 'random',      argumentCount: 0, hasBase: false, returnType: 'number' },
  { label: 'currentUser()', value: 'currentUser', argumentCount: 0, hasBase: false, returnType: 'string' },
]

const fullFunctionOptions = FUNCTIONS.map(f => ({ label: f.label, value: f.value }))

// ─── Props ─────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  modelValue?: Expression
  fieldOptions?: FieldOption[]
  disabled?: boolean
  allowLiteral?: boolean
  allowFunction?: boolean
  baseTypeFilter?: string     // 外部传入的调用方类型过滤条件
}>(), {
  modelValue: () => ({ type: 'field', path: '' }),
  allowLiteral: true,
  allowFunction: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: Expression]
}>()

// ─── 类型选项 ──────────────────────────────────────────────────
const typeOptions = computed(() => {
  const ops: { label: string; value: Expression['type'] }[] = [
    { label: '字段', value: 'field' },
  ]
  if (props.allowLiteral) ops.push({ label: '值', value: 'literal' })
  if (props.allowFunction) ops.push({ label: '方法', value: 'function' })
  return ops
})

const currentType = computed(() => props.modelValue.type)

const currentFunctionDef = computed<FunctionDef | null>(() => {
  if (props.modelValue.type !== 'function') return null
  const funcExpr = props.modelValue as { type: 'function'; call: FunctionCall }
  return FUNCTIONS.find(f => f.value === funcExpr.call.method) ?? null
})

// ─── 字段过滤（根据 baseTypeFilter 裁剪树形字段） ─────────────
function filterFieldTree(opts: FieldOption[], typeFilter?: string): FieldOption[] {
  if (!typeFilter) return opts
  return opts.reduce((acc: FieldOption[], opt) => {
    if (opt.children && opt.children.length > 0) {
      const filteredChildren = filterFieldTree(opt.children, typeFilter)
      if (filteredChildren.length > 0) {
        acc.push({ ...opt, children: filteredChildren })
      }
    } else {
      if (opt.type === typeFilter) acc.push(opt)
    }
    return acc
  }, [])
}

const filteredFieldOptions = computed<FieldOption[]>(() => {
  return filterFieldTree(props.fieldOptions ?? [], props.baseTypeFilter)
})

// ─── 函数过滤（根据 baseTypeFilter 限制函数列表） ─────────────
const filteredFunctionOptions = computed(() => {
  if (!props.baseTypeFilter) return fullFunctionOptions
  return FUNCTIONS
    .filter(f => f.returnType === props.baseTypeFilter)
    .map(f => ({ label: f.label, value: f.value }))
})

// ─── 更新方法 ──────────────────────────────────────────────────
function setType(type: Expression['type']) {
  if (type === 'literal') {
    emit('update:modelValue', { type: 'literal', value: '' })
  } else if (type === 'field') {
    emit('update:modelValue', { type: 'field', path: '' })
  } else {
    emit('update:modelValue', {
      type: 'function',
      call: { method: '', base: undefined, args: [] },
    })
  }
}

function updateLiteral(value: string) {
  emit('update:modelValue', { type: 'literal', value })
}

function updateFieldPath(path: string) {
  emit('update:modelValue', { type: 'field', path })
}

function updateCall(partial: Partial<FunctionCall>) {
  if (props.modelValue.type !== 'function') return
  emit('update:modelValue', {
    ...props.modelValue,
    call: { ...props.modelValue.call, ...partial },
  })
}

function onMethodChange(method: string) {
  const def = FUNCTIONS.find(f => f.value === method)
  if (!def) return

  const args: Expression[] = Array.from({ length: def.argumentCount }, () => ({
    type: 'literal' as const,
    value: '',
  }))

  emit('update:modelValue', {
    type: 'function',
    call: {
      method,
      base: def.hasBase ? { type: 'field', path: '' } : undefined,
      args,
    },
  })
}

function updateArg(index: number, expr: Expression) {
  if (props.modelValue.type !== 'function') return
  const args = [...props.modelValue.call.args]
  args[index] = expr
  emit('update:modelValue', {
    ...props.modelValue,
    call: { ...props.modelValue.call, args },
  })
}

// ─── 占位符文本 ────────────────────────────────────────────────
const literalPlaceholder = computed(() => {
  if (props.baseTypeFilter) return `输入${props.baseTypeFilter}值…`
  return '输入值…'
})
</script>

<template>
  <div class="flex items-center gap-1">
    <!-- 类型切换 -->
    <n-select
      :value="currentType"
      :options="typeOptions"
      size="small"
      class="!w-[72px]"
      :disabled="disabled"
      @update:value="setType"
    />

    <!-- 字面量 -->
    <template v-if="modelValue.type === 'literal'">
      <n-input
        :value="modelValue.value"
        :placeholder="literalPlaceholder"
        size="small"
        :disabled="disabled"
        class="!w-[120px]"
        @update:value="updateLiteral"
      />
    </template>

    <!-- 字段（使用过滤后的树形字段） -->
    <template v-else-if="modelValue.type === 'field'">
      <n-cascader
        :value="modelValue.path"
        :options="filteredFieldOptions"
        placeholder="选择字段…"
        size="small"
        :disabled="disabled"
        class="!w-[160px]"
        clearable
        check-strategy="child"
        @update:value="updateFieldPath"
      />
    </template>

    <!-- 函数调用 -->
    <template v-else-if="modelValue.type === 'function'">
      <!-- 方法选择器（使用过滤后的函数列表） -->
      <n-select
        :value="modelValue.call.method"
        :options="filteredFunctionOptions"
        placeholder="方法…"
        size="small"
        :disabled="disabled"
        class="!w-[130px]"
        @update:value="onMethodChange"
      />

      <span class="text-gray-400 font-mono text-sm">(</span>

      <!-- 调用方（如果需要） -->
      <template v-if="currentFunctionDef?.hasBase && modelValue.call.base">
        <ExpressionEditor
          :model-value="modelValue.call.base"
          :field-options="filteredFieldOptions"
          :base-type-filter="currentFunctionDef?.baseType"
          :disabled="disabled"
          @update:model-value="(v: Expression) => updateCall({ base: v })"
        />
        <span v-if="modelValue.call.args.length > 0" class="text-gray-400 font-mono text-sm">,</span>
      </template>

      <!-- 参数列表 -->
      <template v-for="(arg, index) in modelValue.call.args" :key="'arg' + index">
        <span v-if="index > 0 || (currentFunctionDef?.hasBase ? true : index > 0)" class="text-gray-400 font-mono text-sm">,</span>
        <ExpressionEditor
          :model-value="arg"
          :field-options="filteredFieldOptions"
          :disabled="disabled"
          @update:model-value="(v: Expression) => updateArg(index, v)"
        />
      </template>

      <span class="text-gray-400 font-mono text-sm">)</span>
    </template>
  </div>
</template>
