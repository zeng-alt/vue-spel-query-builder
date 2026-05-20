<script setup lang="ts">
import { useRuleTree } from '../../composables'
import type { RuleTreeProps, RuleTreeEmits, RuleTreeInstance } from '../../types'
import RuleTreeNode from './RuleTreeNode.vue'

const props = defineProps<RuleTreeProps>()
const emit = defineEmits<RuleTreeEmits>()

const { getSpelExpression, setSpelExpression, addCondition, addGroup, removeNode, updateNode, validate } = useRuleTree(props, emit)

defineExpose<RuleTreeInstance>({
  getSpelExpression,
  setSpelExpression,
  validate,
})
</script>

<template>
  <div class="rule-tree-container">
    <RuleTreeNode
      :node="modelValue"
      :authentication="authentication"
      :principal="principal"
      :locals="locals"
      :disabled="disabled"
      :level="0"
      @add-condition="addCondition"
      @add-group="addGroup"
      @remove-node="removeNode"
      @update-node="updateNode"
    />
  </div>
</template>

<style scoped>
.rule-tree-container {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  min-height: 200px;
}
</style>
