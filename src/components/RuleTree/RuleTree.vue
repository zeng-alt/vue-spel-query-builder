<script setup lang="ts">
import { computed } from 'vue'
import { useRuleTree } from '../../composables'
import { DEFAULT_COMPARATORS } from '../../constants'
import type { RuleTreeProps, RuleTreeEmits, RuleTreeInstance } from '../../types'
import RuleTreeNode from './RuleTreeNode.vue'

const props = defineProps<RuleTreeProps>()
const emit = defineEmits<RuleTreeEmits>()

const { getSpelExpression, setSpelExpression, addCondition, addGroup, removeNode, updateNode, validate } = useRuleTree(props, emit)

const contextFields = computed(() => {
  if (!props.context) {
    return []
  }
  return Object.keys(props.context).map(key => ({
    label: key,
    value: key,
  }))
})

const availableComparators = (fieldType?: string) => {
  if (!fieldType) {
    return DEFAULT_COMPARATORS
  }
  return DEFAULT_COMPARATORS.filter(c => c.types.includes(fieldType))
}

defineExpose<RuleTreeInstance>({
  getSpelExpression,
  setSpelExpression,
  validate,
})
</script>

<template>
  <div class="p-3">
    <RuleTreeNode
      :node="modelValue"
      :context="context"
      :disabled="disabled"
      @add-condition="addCondition"
      @add-group="addGroup"
      @remove-node="removeNode"
      @update-node="updateNode"
    />
  </div>
</template>
