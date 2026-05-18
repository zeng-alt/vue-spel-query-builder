<script setup lang="ts">
import { computed } from 'vue'
import type { RuleNode, FieldOption, ValueSource, FieldSource, LogicalOperator, FunctionArgument } from '../../types'

const props = defineProps<{
  node: RuleNode
  context?: Record<string, any>
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

const handleAddCondition = () => emit('add-condition', props.node.id)
const handleAddGroup = () => emit('add-group', props.node.id)
const handleRemove = () => emit('remove-node', props.node.id)
const handleUpdate = (updates: Partial<RuleNode>) => emit('update-node', props.node.id, updates)

interface FunctionOption {
  label: string
  value: string
  needsArgument: boolean
  argumentType?: 'string' | 'number' | 'field'
}

const fieldOptions = computed<FieldOption[]>(() => {
  if (!props.context) return []
  return buildFieldOptions(props.context)
})

const functionOptions: FunctionOption[] = [
  { label: 'length()', value: 'length()', needsArgument: false },
  { label: 'size()', value: 'size()', needsArgument: false },
  { label: 'toUpperCase()', value: 'toUpperCase()', needsArgument: false },
  { label: 'toLowerCase()', value: 'toLowerCase()', needsArgument: false },
  { label: 'trim()', value: 'trim()', needsArgument: false },
  { label: 'abs()', value: 'abs()', needsArgument: false },
  { label: 'round()', value: 'round()', needsArgument: false },
  { label: 'startsWith()', value: 'startsWith', needsArgument: true, argumentType: 'string' },
  { label: 'endsWith()', value: 'endsWith', needsArgument: true, argumentType: 'string' },
  { label: 'contains()', value: 'contains', needsArgument: true, argumentType: 'string' },
]

function buildFieldOptions(obj: Record<string, any>, prefix = ''): FieldOption[] {
  const options: FieldOption[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      options.push({
        label: key,
        value: fullPath,
        type: 'object',
        children: buildFieldOptions(value, fullPath)
      })
    } else {
      options.push({
        label: key,
        value: fullPath,
        type: typeof value
      })
    }
  }
  return options
}

const valueSourceOptions = [
  { label: '值', value: 'value' },
  { label: '字段', value: 'field' },
  { label: '函数', value: 'function' },
]

const fieldSourceOptions = [
  { label: '字段', value: 'field' },
  { label: '函数', value: 'function' },
]

const comparatorOptions = [
  { label: '==', value: '==' },
  { label: '!=', value: '!=' },
  { label: '>', value: '>' },
  { label: '>=', value: '>=' },
  { label: '<', value: '<' },
  { label: '<=', value: '<=' },
]

const logicalOperatorOptions = computed(() => {
  const childrenCount = props.node.children?.length ?? 0
  if (childrenCount <= 1) {
    return [
      { label: '且', value: 'and' },
      { label: '或', value: 'or' },
      { label: '非', value: 'not' },
    ]
  }
  return [
    { label: '且', value: 'and' },
    { label: '或', value: 'or' },
    { label: '非', value: 'not' },
  ]
})

const currentOperator = computed(() => {
  return props.node.operator ?? 'and'
})

const currentFieldFunction = computed(() => {
  if (props.node.fieldSource !== 'function' || !props.node.field) return null
  return functionOptions.find(f => props.node.field?.startsWith(f.value))
})

const needsFieldFunctionArgument = computed(() => {
  return currentFieldFunction.value?.needsArgument ?? false
})

const currentValueFunction = computed(() => {
  if (props.node.valueSource !== 'function' || !props.node.value) return null
  return functionOptions.find(f => props.node.value?.startsWith(f.value))
})

const needsValueFunctionArgument = computed(() => {
  return currentValueFunction.value?.needsArgument ?? false
})

function handleOperatorChange(value: LogicalOperator) {
  handleUpdate({ operator: value })
}

function handleFieldSourceChange(source: FieldSource) {
  handleUpdate({ fieldSource: source, field: undefined, functionArgument: undefined })
}

function handleValueSourceChange(source: ValueSource) {
  handleUpdate({ valueSource: source, value: undefined, valueFunctionArgument: undefined })
}

function handleFieldFunctionSelect(option: FunctionOption) {
  const newArg: FunctionArgument | undefined = option.needsArgument ? { type: 'value' } : undefined
  handleUpdate({ field: option.value, functionArgument: newArg })
}

function handleValueFunctionSelect(option: FunctionOption) {
  const newArg: FunctionArgument | undefined = option.needsArgument ? { type: 'value' } : undefined
  handleUpdate({ value: option.value, valueFunctionArgument: newArg })
}

function handleFieldFunctionArgumentTypeChange(type: ValueSource) {
  if (!props.node.functionArgument) return
  handleUpdate({
    functionArgument: {
      type,
      value: undefined,
      functionArgument: undefined,
    },
  })
}

function handleFieldFunctionArgumentValueChange(value: any) {
  if (!props.node.functionArgument) return
  handleUpdate({
    functionArgument: {
      ...props.node.functionArgument,
      value,
    },
  })
}

function handleValueFunctionArgumentTypeChange(type: ValueSource) {
  if (!props.node.valueFunctionArgument) return
  handleUpdate({
    valueFunctionArgument: {
      type,
      value: undefined,
      functionArgument: undefined,
    },
  })
}

function handleValueFunctionArgumentValueChange(value: any) {
  if (!props.node.valueFunctionArgument) return
  handleUpdate({
    valueFunctionArgument: {
      ...props.node.valueFunctionArgument,
      value,
    },
  })
}
</script>

<template>
  <div v-if="node.type === 'condition'" class="flex items-center gap-2 py-2 px-3 bg-white rounded border border-gray-200 hover:border-blue-400 transition-colors">
    <n-select
      :value="node.fieldSource ?? 'field'"
      :options="fieldSourceOptions"
      placeholder="类型…"
      :disabled="disabled"
      size="small"
      class="w-20"
      @update:value="handleFieldSourceChange"
    />

    <div v-if="(node.fieldSource === 'field' || !node.fieldSource) && fieldOptions.length > 0" class="flex items-center gap-1">
      <n-cascader
        :value="node.field"
        :options="fieldOptions"
        placeholder="字段…"
        :disabled="disabled"
        size="small"
        class="w-40"
        clearable
        check-strategy="child"
        @update:value="(value) => handleUpdate({ field: value as string })"
      />
    </div>

    <div v-else-if="node.fieldSource === 'function'" class="flex items-center gap-1">
      <n-select
        :value="node.field"
        :options="functionOptions"
        placeholder="函数…"
        :disabled="disabled"
        size="small"
        class="w-40"
        @update:value="(value) => {
          const option = functionOptions.find(f => f.value === value)
          if (option) handleFieldFunctionSelect(option)
        }"
      />
      <div v-if="needsFieldFunctionArgument && node.functionArgument" class="flex items-center gap-1">
        <span>(</span>
        <n-select
          :value="node.functionArgument.type"
          :options="valueSourceOptions"
          :disabled="disabled"
          size="small"
          class="w-20"
          @update:value="handleFieldFunctionArgumentTypeChange"
        />
        <n-input
          v-if="node.functionArgument.type === 'value'"
          :value="node.functionArgument.value"
          placeholder="值…"
          :disabled="disabled"
          size="small"
          class="w-28"
          @update:value="handleFieldFunctionArgumentValueChange"
        />
        <n-cascader
          v-else-if="node.functionArgument.type === 'field' && fieldOptions.length > 0"
          :value="node.functionArgument.value"
          :options="fieldOptions"
          placeholder="字段…"
          :disabled="disabled"
          size="small"
          class="w-40"
          clearable
          check-strategy="child"
          @update:value="handleFieldFunctionArgumentValueChange"
        />
        <n-select
          v-else-if="node.functionArgument.type === 'function'"
          :value="node.functionArgument.value"
          :options="functionOptions"
          placeholder="函数…"
          :disabled="disabled"
          size="small"
          class="w-40"
          @update:value="(value) => {
            handleFieldFunctionArgumentValueChange(value)
            const option = functionOptions.find(f => f.value === value)
            if (option?.needsArgument) {
              handleUpdate({
                functionArgument: {
                  ...node.functionArgument,
                  functionArgument: { type: 'value' },
                },
              })
            }
          }"
        />
        <span>)</span>
      </div>
    </div>

    <n-select
      :value="node.comparator"
      :options="comparatorOptions"
      placeholder="操作…"
      :disabled="disabled"
      size="small"
      class="w-16"
      @update:value="(value) => handleUpdate({ comparator: value as string })"
    />

    <n-select
      v-if="node.comparator && !['isEmpty', 'isNotEmpty'].includes(node.comparator)"
      :value="node.valueSource ?? 'value'"
      :options="valueSourceOptions"
      placeholder="值类型…"
      :disabled="disabled"
      size="small"
      class="w-20"
      @update:value="handleValueSourceChange"
    />

    <n-input
      v-if="node.comparator && !['isEmpty', 'isNotEmpty'].includes(node.comparator) && node.valueSource === 'value'"
      :value="node.value"
      placeholder="值…"
      :disabled="disabled"
      size="small"
      class="flex-1 min-w-24"
      @update:value="(value) => handleUpdate({ value })"
    />

    <div v-else-if="node.comparator && !['isEmpty', 'isNotEmpty'].includes(node.comparator) && node.valueSource === 'field' && fieldOptions.length > 0" class="flex-1 min-w-24">
      <n-cascader
        :value="node.value"
        :options="fieldOptions"
        placeholder="值字段…"
        :disabled="disabled"
        size="small"
        class="w-full"
        clearable
        check-strategy="child"
        @update:value="(value) => handleUpdate({ value })"
      />
    </div>

    <div v-else-if="node.comparator && !['isEmpty', 'isNotEmpty'].includes(node.comparator) && node.valueSource === 'function'" class="flex items-center gap-1 flex-1 min-w-24">
      <n-select
        :value="node.value"
        :options="functionOptions"
        placeholder="值函数…"
        :disabled="disabled"
        size="small"
        class="w-40"
        @update:value="(value) => {
          const option = functionOptions.find(f => f.value === value)
          if (option) handleValueFunctionSelect(option)
        }"
      />
      <div v-if="needsValueFunctionArgument && node.valueFunctionArgument" class="flex items-center gap-1">
        <span>(</span>
        <n-select
          :value="node.valueFunctionArgument.type"
          :options="valueSourceOptions"
          :disabled="disabled"
          size="small"
          class="w-20"
          @update:value="handleValueFunctionArgumentTypeChange"
        />
        <n-input
          v-if="node.valueFunctionArgument.type === 'value'"
          :value="node.valueFunctionArgument.value"
          placeholder="值…"
          :disabled="disabled"
          size="small"
          class="w-28"
          @update:value="handleValueFunctionArgumentValueChange"
        />
        <n-cascader
          v-else-if="node.valueFunctionArgument.type === 'field' && fieldOptions.length > 0"
          :value="node.valueFunctionArgument.value"
          :options="fieldOptions"
          placeholder="字段…"
          :disabled="disabled"
          size="small"
          class="w-40"
          clearable
          check-strategy="child"
          @update:value="handleValueFunctionArgumentValueChange"
        />
        <n-select
          v-else-if="node.valueFunctionArgument.type === 'function'"
          :value="node.valueFunctionArgument.value"
          :options="functionOptions"
          placeholder="函数…"
          :disabled="disabled"
          size="small"
          class="w-40"
          @update:value="(value) => {
            handleValueFunctionArgumentValueChange(value)
          }"
        />
        <span>)</span>
      </div>
    </div>

    <n-button
      type="error"
      size="small"
      quaternary
      circle
      :disabled="disabled"
      @click="handleRemove"
      aria-label="删除条件"
    >
      <template #icon>
        <span class="i-carbon:trash-can text-xs" />
      </template>
    </n-button>
  </div>

  <div
    v-else
    class="group-node"
    :style="{ marginLeft: level > 0 ? '20px' : '0' }"
  >
    <div class="flex items-center gap-2 mb-2">
      <n-select
        :value="currentOperator"
        :options="logicalOperatorOptions"
        :disabled="disabled"
        size="small"
        class="w-20"
        @update:value="handleOperatorChange"
      />

      <n-divider vertical class="mx-1" />

      <n-space size="small">
        <n-button
          type="primary"
          size="small"
          :disabled="disabled"
          @click="handleAddCondition"
        >
          <template #icon>
            <span class="i-carbon:add" />
          </template>
          条件
        </n-button>
        <n-button
          type="info"
          size="small"
          :disabled="disabled"
          @click="handleAddGroup"
        >
          <template #icon>
            <span class="i-carbon:folder-add" />
          </template>
          分组
        </n-button>
        <n-button
          v-if="level > 0"
          type="error"
          size="small"
          quaternary
          circle
          :disabled="disabled"
          @click="handleRemove"
          aria-label="删除分组"
        >
          <template #icon>
            <span class="i-carbon:trash-can" />
          </template>
        </n-button>
      </n-space>
    </div>

    <div class="relative">
      <div
        v-if="node.children && node.children.length > 0"
        class="absolute left-0 top-0 bottom-0 w-px bg-gray-300"
        :style="{ left: '10px' }"
      />

      <div class="flex flex-col gap-2 pl-5">
        <RuleTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :context="context"
          :disabled="disabled"
          :level="level + 1"
          @add-condition="(id) => $emit('add-condition', id)"
          @add-group="(id) => $emit('add-group', id)"
          @remove-node="(id) => $emit('remove-node', id)"
          @update-node="(id, updates) => $emit('update-node', id, updates)"
        />

        <div
          v-if="!node.children || node.children.length === 0"
          class="text-center py-6 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300"
        >
          <span class="i-carbon:add-circle text-2xl mx-auto mb-1 opacity-50 block" />
          <p class="text-xs">暂无条件</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-node {
  position: relative;
}

.group-node::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 14px;
  width: 10px;
  height: 1px;
  background-color: #d1d5db;
}
</style>
