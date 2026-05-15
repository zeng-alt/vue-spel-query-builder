import { StandardContext, SpelExpressionEvaluator } from 'spel2js'
import type { RuleNode } from '../types'

export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function validateSpelExpression(expression: string, context?: Record<string, any>): { valid: boolean; error?: string } {
  try {
    const spelContext = StandardContext.create()
    SpelExpressionEvaluator.compile(expression)
    return { valid: true }
  }
  catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid SpEL expression' }
  }
}

export function evalSpelExpression(expression: string, context: Record<string, any>): any {
  try {
    const spelContext = StandardContext.create()
    return SpelExpressionEvaluator.eval(expression, spelContext, context)
  }
  catch (error) {
    console.error('SpEL evaluation error:', error)
    return null
  }
}

export function ruleNodeToSpel(node: RuleNode): string {
  if (node.type === 'condition') {
    if (!node.field || !node.comparator) {
      return ''
    }
    const field = `#${node.field}`
    const value = formatSpelValue(node.value)

    switch (node.comparator) {
      case '==':
        return `${field} == ${value}`
      case '!=':
        return `${field} != ${value}`
      case '>':
        return `${field} > ${value}`
      case '>=':
        return `${field} >= ${value}`
      case '<':
        return `${field} < ${value}`
      case '<=':
        return `${field} <= ${value}`
      case 'contains':
        return `${field}.contains(${value})`
      case 'startsWith':
        return `${field}.startsWith(${value})`
      case 'endsWith':
        return `${field}.endsWith(${value})`
      case 'matches':
        return `${field}.matches(${value})`
      case 'isEmpty':
        return `${field} == null || ${field}.isEmpty()`
      case 'isNotEmpty':
        return `${field} != null && !${field}.isEmpty()`
      case 'in':
        return `${value}.contains(${field})`
      case 'not in':
        return `!${value}.contains(${field})`
      default:
        return `${field} ${node.comparator} ${value}`
    }
  }
  else if (node.type === 'group' && node.children && node.children.length > 0) {
    const operator = node.operator === 'or' ? ' || ' : ' && '
    const childrenExpressions = node.children
      .map(ruleNodeToSpel)
      .filter(exp => exp.trim() !== '')
    if (childrenExpressions.length === 0) {
      return ''
    }
    if (childrenExpressions.length === 1) {
      return childrenExpressions[0]
    }
    return `(${childrenExpressions.join(operator)})`
  }
  return ''
}

function formatSpelValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "\\'")}'`
  }
  if (typeof value === 'boolean') {
    return value.toString()
  }
  if (Array.isArray(value)) {
    return `{${value.map(v => formatSpelValue(v)).join(', ')}}`
  }
  return String(value)
}

export function createEmptyCondition(): RuleNode {
  return {
    id: generateId(),
    type: 'condition',
  }
}

export function createEmptyGroup(operator: 'and' | 'or' = 'and'): RuleNode {
  return {
    id: generateId(),
    type: 'group',
    operator,
    children: [],
  }
}
