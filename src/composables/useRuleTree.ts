import { ruleNodeToSpel, createEmptyCondition, createEmptyGroup } from '../utils'
import type { RuleNode, RuleTreeProps } from '../types'
import { StandardContext, SpelExpressionEvaluator } from 'spel2js'

export function useRuleTree(props: RuleTreeProps, emit: any) {
  const getSpelExpression = () => {
    return ruleNodeToSpel(props.modelValue)
  }

  const setSpelExpression = (_expression: string) => {
    console.warn('SpEL parsing to RuleTree is not implemented yet')
  }

  const addCondition = (parentId: string) => {
    const newNode = createEmptyCondition()
    const updateNode = (node: RuleNode): RuleNode => {
      if (node.id === parentId && node.children) {
        return { ...node, children: [...node.children, newNode] }
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) }
      }
      return node
    }
    const newValue = updateNode(props.modelValue)
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }

  const addGroup = (parentId: string, operator: 'and' | 'or' = 'and') => {
    const newNode = createEmptyGroup(operator)
    const updateNode = (node: RuleNode): RuleNode => {
      if (node.id === parentId && node.children) {
        return { ...node, children: [...node.children, newNode] }
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) }
      }
      return node
    }
    const newValue = updateNode(props.modelValue)
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }

  const removeNode = (nodeId: string) => {
    const updateNode = (node: RuleNode): RuleNode | null => {
      if (node.id === nodeId) {
        return null
      }
      if (node.children) {
        const filteredChildren = node.children
          .map(updateNode)
          .filter((n): n is RuleNode => n !== null)
        return { ...node, children: filteredChildren }
      }
      return node
    }
    const newValue = updateNode(props.modelValue)
    if (newValue) {
      emit('update:modelValue', newValue)
      emit('change', newValue)
    }
  }

  const updateNode = (nodeId: string, updates: Partial<RuleNode>) => {
    const doUpdate = (node: RuleNode): RuleNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates }
      }
      if (node.children) {
        return { ...node, children: node.children.map(doUpdate) }
      }
      return node
    }
    const newValue = doUpdate(props.modelValue)
    emit('update:modelValue', newValue)
    emit('change', newValue)
  }

  const validate = () => {
    try {
      const expression = getSpelExpression()
      if (!expression.trim()) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  const run = (props: RuleTreeProps, sepl: string) => {
    const spelContext = StandardContext.create(props.authentication, props.principal)
    return SpelExpressionEvaluator.eval(sepl, spelContext, props.locals)
  }

  return {
    getSpelExpression,
    setSpelExpression,
    addCondition,
    addGroup,
    removeNode,
    updateNode,
    validate,
    run,
  }
}
