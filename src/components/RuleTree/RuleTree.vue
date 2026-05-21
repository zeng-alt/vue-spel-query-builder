<script setup lang="ts">
import { useRuleTree } from '../../composables'
import type { RuleTreeProps, RuleTreeEmits, RuleTreeInstance } from '../../types'
import RuleTreeNode from './RuleTreeNode.vue'

const props = withDefaults(defineProps<RuleTreeProps>(), {
  theme: 'light',
})
const emit = defineEmits<RuleTreeEmits>()

const { getSpelExpression, setSpelExpression, addCondition, addGroup, removeNode, updateNode, validate } = useRuleTree(props, emit)

defineExpose<RuleTreeInstance>({
  getSpelExpression,
  setSpelExpression,
  validate,
})
</script>

<template>
  <div class="rule-tree-container" :class="`theme--${props.theme}`">
    <RuleTreeNode
      :node="modelValue"
      :authentication="authentication"
      :principal="principal"
      :locals="locals"
      :disabled="disabled"
      :level="0"
      :theme="props.theme"
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
  border-radius: 8px;
  min-height: 200px;
  transition: background 0.2s, border-color 0.2s;
}
.rule-tree-container.theme--light {
  background: #f8fafc;
}
.rule-tree-container.theme--dark {
  background: #1a1a2e;
}
</style>
