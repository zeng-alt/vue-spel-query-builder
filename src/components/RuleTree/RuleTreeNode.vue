<script setup lang="ts">
import type { RuleNode } from '../../types'

const props = defineProps<{
  node: RuleNode
  context?: Record<string, any>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-condition', id: string): void
  (e: 'add-group', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'update-node', id: string, updates: Partial<RuleNode>): void
}>()

const handleAddCondition = () => emit('add-condition', props.node.id)
const handleAddGroup = () => emit('add-group', props.node.id)
const handleRemove = () => emit('remove-node', props.node.id)
const handleUpdate = (updates: Partial<RuleNode>) => emit('update-node', props.node.id, updates)
</script>

<template>
  <div v-if="node.type === 'condition'" class="flex items-center gap-2 py-2">
    <n-select
      :value="node.field"
      :options="context ? Object.keys(context).map(key => ({ label: key, value: key })) : []"
      placeholder="选择字段"
      :disabled="disabled"
      class="w-150px"
      @update:value="(value) => handleUpdate({ field: value as string })"
    />
    <n-select
      :value="node.comparator"
      :options="[{ label: '等于', value: '==' }, { label: '不等于', value: '!=' }, { label: '大于', value: '>' }, { label: '大于等于', value: '>=' }, { label: '小于', value: '<' }, { label: '小于等于', value: '<=' }, { label: '包含', value: 'contains' }, { label: '开头', value: 'startsWith' }, { label: '结尾', value: 'endsWith' }, { label: '正则匹配', value: 'matches' }, { label: '在列表中', value: 'in' }, { label: '不在列表中', value: 'not in' }, { label: '为空', value: 'isEmpty' }, { label: '不为空', value: 'isNotEmpty' }]"
      placeholder="选择操作"
      :disabled="disabled"
      class="w-120px"
      @update:value="(value) => handleUpdate({ comparator: value as string })"
    />
    <n-input
      :value="node.value"
      placeholder="输入值"
      :disabled="disabled"
      class="flex-1"
      @update:value="(value) => handleUpdate({ value })"
    />
    <n-button
      type="error"
      size="small"
      quaternary
      :disabled="disabled"
      @click="handleRemove"
    >
      <template #icon>
        <div class="i-carbon-trash-can text-red-500" />
      </template>
    </n-button>
  </div>
  <n-card v-else size="small" class="my-2">
    <template #header-extra>
      <n-space size="small">
        <n-select
          :value="node.operator"
          :options="[{ label: '且', value: 'and' }, { label: '或', value: 'or' }]"
          :disabled="disabled"
          class="w-80px"
          size="small"
          @update:value="(value) => handleUpdate({ operator: value as 'and' | 'or' })"
        />
        <n-button
          type="primary"
          size="small"
          quaternary
          :disabled="disabled"
          @click="handleAddCondition"
        >
          <template #icon>
            <div class="i-carbon-add text-blue-500" />
          </template>
          条件
        </n-button>
        <n-button
          type="info"
          size="small"
          quaternary
          :disabled="disabled"
          @click="handleAddGroup"
        >
          <template #icon>
            <div class="i-carbon-folder-add text-cyan-500" />
          </template>
          分组
        </n-button>
        <n-button
          type="error"
          size="small"
          quaternary
          :disabled="disabled"
          @click="handleRemove"
        >
          <template #icon>
            <div class="i-carbon-trash-can text-red-500" />
          </template>
        </n-button>
      </n-space>
    </template>
    <div class="flex flex-col gap-2">
      <RuleTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :context="context"
        :disabled="disabled"
        @add-condition="emit('add-condition', $event)"
        @add-group="emit('add-group', $event)"
        @remove-node="emit('remove-node', $event)"
        @update-node="emit('update-node', $event, arguments[1])"
      />
    </div>
  </n-card>
</template>
