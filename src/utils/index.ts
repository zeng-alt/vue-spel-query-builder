import { StandardContext, SpelExpressionEvaluator } from 'spel2js'
import type { RuleNode, LogicalOperator, Expression } from '../types'

export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function validateSpelExpression(expression: string): { valid: boolean; error?: string } {
  try {
    SpelExpressionEvaluator.compile(expression)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid SpEL expression',
    }
  }
}

export function evalSpelExpression(expression: string, context: Record<string, any>): any {
  try {
    const spelContext = StandardContext.create()
    return SpelExpressionEvaluator.eval(expression, spelContext, context)
  } catch (error) {
    console.error('SpEL evaluation error:', error)
    return null
  }
}

/**
 * 将 RuleNode 树转换为 SpEL 表达式字符串
 */
export function ruleNodeToSpel(node: RuleNode): string {
  if (node.type === 'condition') {
    if (!node.left || !node.comparator) return ''

    const leftExpr = formatExpression(node.left)
    const rightExpr = node.right ? formatExpression(node.right) : ''

    switch (node.comparator) {
      case '==':
        return `${leftExpr} == ${rightExpr}`
      case '!=':
        return `${leftExpr} != ${rightExpr}`
      case '>':
        return `${leftExpr} > ${rightExpr}`
      case '>=':
        return `${leftExpr} >= ${rightExpr}`
      case '<':
        return `${leftExpr} < ${rightExpr}`
      case '<=':
        return `${leftExpr} <= ${rightExpr}`
      case 'isEmpty':
        return `${leftExpr} == null || ${leftExpr}.isEmpty()`
      case 'isNotEmpty':
        return `${leftExpr} != null && !${leftExpr}.isEmpty()`
      case 'isNull':
        return `${leftExpr} == null`
      case 'isNotNull':
        return `${leftExpr} != null`
      default:
        return `${leftExpr} ${node.comparator} ${rightExpr}`
    }
  }

  if (node.type === 'group' && node.children?.length) {
    const childExps = node.children.map(ruleNodeToSpel).filter((exp) => exp.trim() !== '')

    if (childExps.length === 0) return ''

    if (childExps.length === 1) {
      return node.operator === 'not' ? `!(${childExps[0]})` : childExps[0] || ''
    }

    const separator = node.operator === 'or' ? ' || ' : ' && '
    const combined = `(${childExps.join(separator)})`

    return node.operator === 'not' ? `!${combined}` : combined
  }

  return ''
}

/**
 * 格式化 Expression 为 SpEL 字符串
 * - 字面量：'字符串'，数字不加引号（这里简单处理，所有字面量加单引号，数字可后续增强）
 * - 字段：直接使用路径
 * - 函数：base.method(arg1, arg2, ...)
 */
export function formatExpression(expr?: Expression): string {
  if (!expr) return ''
  switch (expr.type) {
    case 'literal':
      return formatLiteral(expr.value)
    case 'field':
      return expr.path
    case 'function': {
      const base = expr.call.base ? formatExpression(expr.call.base) : ''
      const args = expr.call.args.map(formatExpression).join(', ')
      // 有 base：base.method(args)；无 base：method(args)
      if (base) {
        return `${base}.${expr.call.method}(${args})`
      }
      return `${expr.call.method}(${args})`
    }
    default:
      return ''
  }
}

/**
 * 格式化字面量：字符串用单引号包裹并转义，数字/布尔不加引号
 */
function formatLiteral(value: string): string {
  if (value === '' || value === undefined || value === null) return "''"
  // 整数或小数
  if (/^-?\d+(\.\d+)?$/.test(value)) return value
  // 布尔值
  if (value === 'true' || value === 'false') return value
  // 其他一律作为字符串处理
  if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") return value
  return `'${value}'`
}

/**
 * 创建一个新的空白条件节点
 */
export function createEmptyCondition(): RuleNode {
  return {
    id: generateId(),
    type: 'condition',
    left: { type: 'field', path: '' }, // 默认选择字段
    comparator: '==',
  }
}

/**
 * 创建一个新的空白分组节点
 */
export function createEmptyGroup(operator: LogicalOperator = 'and'): RuleNode {
  return {
    id: generateId(),
    type: 'group',
    operator,
    children: [],
  }
}
