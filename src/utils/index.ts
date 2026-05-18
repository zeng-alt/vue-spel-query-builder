import { StandardContext, SpelExpressionEvaluator } from 'spel2js'
import type { RuleNode, LogicalOperator, FunctionArgument } from '../types'

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

function formatFunctionArgument(arg?: FunctionArgument): string {
  if (!arg) return ''
  switch (arg.type) {
    case 'value':
      return formatSpelValue(arg.value)
    case 'field':
      const field = arg.value as string
      return field.startsWith('#') ? field : `#${field}`
    case 'function':
      let funcName = (arg.value as string) || ''
      if (funcName.endsWith('()')) {
        funcName = funcName.slice(0, -2)
      }
      const nestedArg = formatFunctionArgument(arg.functionArgument)
      return `${funcName}(${nestedArg})`
    default:
      return ''
  }
}

export function ruleNodeToSpel(node: RuleNode): string {
  if (node.type === 'condition') {
    if (!node.field || !node.comparator) {
      return ''
    }
    const field = formatField(node.field, node.fieldSource, node.functionArgument)
    const value = formatValue(node.value, node.valueSource, node.valueFunctionArgument)

    let expression = ''
    switch (node.comparator) {
      case '==':
        expression = `${field} == ${value}`
        break
      case '!=':
        expression = `${field} != ${value}`
        break
      case '>':
        expression = `${field} > ${value}`
        break
      case '>=':
        expression = `${field} >= ${value}`
        break
      case '<':
        expression = `${field} < ${value}`
        break
      case '<=':
        expression = `${field} <= ${value}`
        break
      case 'isEmpty':
        expression = `${field} == null || ${field}.isEmpty()`
        break
      case 'isNotEmpty':
        expression = `${field} != null && !${field}.isEmpty()`
        break
      default:
        expression = `${field} ${node.comparator} ${value}`
    }

    return expression
  }
  else if (node.type === 'group' && node.children && node.children.length > 0) {
    const childrenExpressions = node.children
      .map(ruleNodeToSpel)
      .filter(exp => exp.trim() !== '')

    if (childrenExpressions.length === 0) {
      return ''
    }

    if (childrenExpressions.length === 1) {
      // Apply NOT operator if set
      if (node.operator === 'not') {
        return `!(${childrenExpressions[0]})`
      }
      return childrenExpressions[0]
    }

    // Multiple children - use AND or OR
    const operator = node.operator === 'or' ? ' || ' : ' && '
    const combined = `(${childrenExpressions.join(operator)})`

    // Apply NOT operator if set
    if (node.operator === 'not') {
      return `!${combined}`
    }

    return combined
  }
  return ''
}

function formatField(field: string, fieldSource?: string, functionArgument?: FunctionArgument): string {
  if (fieldSource === 'function') {
    // Handle functions with arguments
    let funcName = field
    if (funcName.endsWith('()')) {
      funcName = funcName.slice(0, -2)
    }
    if (functionArgument) {
      const argExpr = formatFunctionArgument(functionArgument)
      return `${funcName}(${argExpr})`
    }
    // Ensure it has parentheses if it's a function without arguments
    return `${funcName}()`
  }
  // For fields, add # prefix if not already present
  return field.startsWith('#') ? field : `#${field}`
}

function formatValue(value: any, valueSource?: string, functionArgument?: FunctionArgument): string {
  if (valueSource === 'field') {
    return value.startsWith('#') ? value : `#${value}`
  }
  if (valueSource === 'function') {
    // Handle functions with arguments
    let funcName = value as string || ''
    if (funcName.endsWith('()')) {
      funcName = funcName.slice(0, -2)
    }
    if (functionArgument) {
      const argExpr = formatFunctionArgument(functionArgument)
      return `${funcName}(${argExpr})`
    }
    // Ensure it has parentheses if it's a function without arguments
    return `${funcName}()`
  }
  // Default: value source
  return formatSpelValue(value)
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
    return `{${value.map(formatSpelValue).join(', ')}}`
  }
  return String(value)
}

export function createEmptyCondition(): RuleNode {
  return {
    id: generateId(),
    type: 'condition',
    fieldSource: 'field',
    valueSource: 'value',
  }
}

export function createEmptyGroup(operator: LogicalOperator = 'and'): RuleNode {
  return {
    id: generateId(),
    type: 'group',
    operator,
    children: [],
  }
}
