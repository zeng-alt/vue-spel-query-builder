import { spelService } from '../spel-service'
import type { RuleNode, LogicalOperator, Expression, ListFilter } from '../types'

let _idCounter = 0
export function generateId(): string {
  return `node_${Date.now()}_${++_idCounter}_${Math.random().toString(36).substr(2, 9)}`
}

export function validateSpelExpression(expression: string): { valid: boolean; error?: string } {
  try {
    spelService.compile(expression)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid SpEL expression',
    }
  }
}

export function evalSpelExpression(expression: string, locals: Record<string, any>): any {
  try {
    spelService.setContext()
    return spelService.eval(expression, locals)
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
    if (!node.left) return ''
    // 纯列表过滤条件可以没有独立 comparator
    if (!node.comparator && !node.listFilter) return ''

    let leftExpr = formatExpression(node.left)

    // 1. 应用列表过滤
    if (node.listFilter && node.listFilter.comparator) {
      const { comparator, fieldPath, value } = node.listFilter
      let target = '#this'
      if (fieldPath) target = `${fieldPath}`

      switch (comparator) {
        case 'isEmpty':
          leftExpr = `${leftExpr}.?[${target} == null || ${target}.isEmpty()]`
          break
        case 'isNotEmpty':
          leftExpr = `${leftExpr}.?[${target} != null && !${target}.isEmpty()]`
          break
        case 'isNull':
          leftExpr = `${leftExpr}.?[${target} == null]`
          break
        case 'isNotNull':
          leftExpr = `${leftExpr}.?[${target} != null]`
          break
        default: {
          const filterVal = value ? formatExpression(value) : ''
          leftExpr = `${leftExpr}.?[${target} ${comparator} ${filterVal}]`
          break
        }
      }
      // 列表过滤 + 默认 == 比较符 → 列表过滤已完整表达条件，直接返回
      // 列表过滤 + 显式比较符(isNull/isNotNull等) → 继续执行，追加条件级表达式
      if (!node.right && node.comparator === '==') return leftExpr
    }

    // 2. 数组 count 操作符需要追加 .size()
    if (node.comparator?.startsWith('count ')) {
      leftExpr = `${leftExpr}.size()`
      const rightExpr = node.right ? formatExpression(node.right) : ''
      const op = node.comparator.replace('count ', '')
      return `${leftExpr} ${op} ${rightExpr}`
    }

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
      const args = expr.call.args.map(formatExpression)

      if (base) {
        const result = format(expr.call.method, args)
        return `${base}.${result}`
      }
      // 独立函数：如果 method 模板不含 {N}，手动拼接 (arg1, arg2, ...)
      const formatted = format(expr.call.method, args)
      if (formatted === expr.call.method && args.length > 0) {
        return `${expr.call.method}(${args.join(', ')})`
      }
      return formatted
    }
    default:
      return ''
  }
}

function format(template: string, args: string[]): string {
  return template.replace(/\{(\d+)\}/g, (_, index) => {
    return args[index] ?? ''
  })
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

// ─── SpEL → RuleNode 解析 ────────────────────────────────────────────

/**
 * 在顶层拆分表达式（忽略括号内和引号内的内容）
 */
function splitTopLevel(expr: string, operator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let inString = false
  let lastIndex = 0
  const opLen = operator.length

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (ch === "'") {
      inString = !inString
    } else if (!inString) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      else if (ch === '[') depth++
      else if (ch === ']') depth--
      else if (depth === 0 && expr.substring(i, i + opLen) === operator) {
        parts.push(expr.substring(lastIndex, i))
        i += opLen - 1
        lastIndex = i + 1
      }
    }
  }
  parts.push(expr.substring(lastIndex))
  return parts.map((p) => p.trim()).filter((p) => p.length > 0)
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

/**
 * 检查是否为最外层括号包裹，如果是则剥离（递归处理多层）
 */
function stripOuterParens(expr: string): string {
  let s = expr.trim()
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0
    let matched = true
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++
      else if (s[i] === ')') depth--
      if (depth === 0) {
        matched = false
        break
      }
    }
    if (matched) {
      s = s.substring(1, s.length - 1).trim()
    } else {
      break
    }
  }
  return s
}

/**
 * 尝试解析 isEmpty / isNotEmpty / isNull / isNotNull 特殊模式
 */
function tryParseSpecialCondition(expr: string): { field: string; comparator: string } | null {
  const t = expr.trim()

  // isEmpty:  X == null || X.isEmpty()
  const isEmptyMatch = t.match(/^(.+?)\s*==\s*null\s*\|\|\s*\1\.isEmpty\(\)\s*$/)
  if (isEmptyMatch) return { field: isEmptyMatch[1].trim(), comparator: 'isEmpty' }

  // isNotEmpty:  X != null && !X.isEmpty()
  const isNotEmptyMatch = t.match(/^(.+?)\s*!=\s*null\s*&&\s*!\1\.isEmpty\(\)\s*$/)
  if (isNotEmptyMatch) return { field: isNotEmptyMatch[1].trim(), comparator: 'isNotEmpty' }

  // isNull:  X == null
  const isNullMatch = t.match(/^(.+?)\s*==\s*null\s*$/)
  if (isNullMatch) return { field: isNullMatch[1].trim(), comparator: 'isNull' }

  // isNotNull:  X != null
  const isNotNullMatch = t.match(/^(.+?)\s*!=\s*null\s*$/)
  if (isNotNullMatch) return { field: isNotNullMatch[1].trim(), comparator: 'isNotNull' }

  return null
}

/**
 * 尝试解析列表过滤模式:  field.?[condition]
 */
function tryParseListFilter(
  expr: string,
): { base: string; listFilter: ListFilter } | null {
  const t = expr.trim()
  const filterMatch = t.match(/^(.+?)\.\?\[(.+)\]$/)
  if (!filterMatch) return null

  const base = filterMatch[1].trim()
  const condition = filterMatch[2].trim()

  // 特殊条件
  if (condition.match(/^#this\s*==\s*null\s*\|\|\s*#this\.isEmpty\(\)$/))
    return { base, listFilter: { comparator: 'isEmpty' } }
  if (condition.match(/^#this\s*!=\s*null\s*&&\s*!#this\.isEmpty\(\)$/))
    return { base, listFilter: { comparator: 'isNotEmpty' } }
  if (condition.match(/^#this\s*==\s*null$/))
    return { base, listFilter: { comparator: 'isNull' } }
  if (condition.match(/^#this\s*!=\s*null$/))
    return { base, listFilter: { comparator: 'isNotNull' } }

  // #this.field op value (对象元素: #this.code == 'admin')
  const fieldCond = condition.match(/^#this\.([\w.]+)\s+(==|!=|>=|<=|>|<)\s+(.+)$/)
  if (fieldCond) {
    const val = parseExpressionValue(fieldCond[3].trim())
    // 检测 null 比较 → 用 isNull/isNotNull
    if (val?.type === 'field' && val.path === 'null') {
      return {
        base,
        listFilter: { comparator: fieldCond[2] === '==' ? 'isNull' : 'isNotNull', fieldPath: fieldCond[1].trim() },
      }
    }
    return {
      base,
      listFilter: { comparator: fieldCond[2], fieldPath: fieldCond[1].trim(), value: val || undefined },
    }
  }

  // field op value (对象元素: code == 'admin', 无 #this. 前缀)
  const bareFieldCond = condition.match(/^([\w.]+)\s+(==|!=|>=|<=|>|<)\s+(.+)$/)
  if (bareFieldCond) {
    const val = parseExpressionValue(bareFieldCond[3].trim())
    // 检测 null 比较 → 用 isNull/isNotNull
    if (val?.type === 'field' && val.path === 'null') {
      return {
        base,
        listFilter: { comparator: bareFieldCond[2] === '==' ? 'isNull' : 'isNotNull', fieldPath: bareFieldCond[1].trim() },
      }
    }
    return {
      base,
      listFilter: { comparator: bareFieldCond[2], fieldPath: bareFieldCond[1].trim(), value: val || undefined },
    }
  }

  // #this op value (基本类型数组: #this == 'item1')
  const thisCond = condition.match(/^#this\s+(==|!=|>=|<=|>|<)\s+(.+)$/)
  if (thisCond) {
    const val = parseExpressionValue(thisCond[2].trim())
    // 检测 null 比较 → 用 isNull/isNotNull
    if (val?.type === 'field' && val.path === 'null') {
      return {
        base,
        listFilter: { comparator: thisCond[1] === '==' ? 'isNull' : 'isNotNull' },
      }
    }
    return {
      base,
      listFilter: { comparator: thisCond[1], value: val || undefined },
    }
  }

  return null
}

/**
 * 尝试解析列表投影模式:  field.![expr]
 */
/**
 * 解析单个值表达式（字面量或字段引用）
 */
function parseExpressionValue(raw: string): Expression | null {
  const s = raw.trim()
  if (!s) return null

  if (s.startsWith("'") && s.endsWith("'"))
    return { type: 'literal', value: s.slice(1, -1) }
  if (/^-?\d+(\.\d+)?$/.test(s))
    return { type: 'literal', value: s, literalType: 'number' }
  if (s === 'true' || s === 'false')
    return { type: 'literal', value: s }
  return { type: 'field', path: s }
}

/**
 * 尝试解析 count 操作:  expr.size() op value
 */
function tryParseCountOperator(
  expr: string,
): { left: string; comparator: string; right: Expression } | null {
  const t = expr.trim()
  const countMatch = t.match(/^(.+?)\.size\(\)\s+(==|!=|>=|<=|>|<)\s+(.+)$/)
  if (!countMatch) return null
  const right = parseExpressionValue(countMatch[3].trim())
  if (!right) return null
  return {
    left: countMatch[1].trim(),
    comparator: `count ${countMatch[2]}`,
    right,
  }
}

/**
 * 在顶层查找操作符位置（不在括号/引号内），防止多字符操作符误匹配
 */
function findTopLevelOperator(expr: string, operator: string): number {
  let depth = 0
  let bracketDepth = 0
  let inString = false
  for (let i = 0; i <= expr.length - operator.length; i++) {
    const ch = expr[i]
    if (ch === "'") inString = !inString
    else if (!inString) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      else if (ch === '[') bracketDepth++
      else if (ch === ']') bracketDepth--
      else if (depth === 0 && bracketDepth === 0 && expr.substring(i, i + operator.length) === operator) {
        const prevChar = i > 0 ? expr[i - 1] : ' '
        if (operator === '=' && prevChar === '=') continue
        if (operator === '>' && prevChar === '=') continue
        if (operator === '<' && prevChar === '=') continue
        if (operator === '!' && prevChar === '!') continue
        return i
      }
    }
  }
  return -1
}

/**
 * 解析条件表达式（叶子节点）
 */
function parseCondition(expr: string): RuleNode {
  const t = expr.trim()
  if (!t) return createEmptyCondition()

  // 1. 尝试特殊模式 (isEmpty/isNotEmpty/isNull/isNotNull)
  const special = tryParseSpecialCondition(t)
  if (special) {
    return {
      id: generateId(),
      type: 'condition',
      left: parseExpressionValue(special.field) ?? { type: 'field', path: special.field },
      comparator: special.comparator,
    }
  }

  // 2. 尝试列表过滤
  const filterResult = tryParseListFilter(t)
  if (filterResult) {
    return {
      id: generateId(),
      type: 'condition',
      left: parseExpressionValue(filterResult.base) ?? { type: 'field', path: filterResult.base },
      comparator: '==',
      listFilter: filterResult.listFilter,
    }
  }

  // 3. 尝试 count 操作 (含列表过滤组合: #user.roles.?[code == 'admin'].size() == 1)
  const countResult = tryParseCountOperator(t)
  if (countResult) {
    // count 的左值可能包含列表过滤: #user.roles.?[code == 'admin']
    const filterParts = tryParseListFilter(countResult.left)
    if (filterParts) {
      return {
        id: generateId(),
        type: 'condition',
        left: parseExpressionValue(filterParts.base) ?? { type: 'field', path: filterParts.base },
        comparator: countResult.comparator,
        right: countResult.right,
        listFilter: filterParts.listFilter,
      }
    }
    return {
      id: generateId(),
      type: 'condition',
      left: parseExpressionValue(countResult.left) ?? { type: 'field', path: countResult.left },
      comparator: countResult.comparator,
      right: countResult.right,
    }
  }

  // 4. 默认: 按比较符拆分 left op right
  const ops = ['==', '!=', '>=', '<=', '>', '<']
  for (const op of ops) {
    const idx = findTopLevelOperator(t, op)
    if (idx !== -1) {
      const leftStr = t.substring(0, idx).trim()
      const rightStr = t.substring(idx + op.length).trim()
      const left = parseExpressionValue(leftStr) ?? { type: 'field', path: leftStr }
      const right = parseExpressionValue(rightStr) ?? { type: 'field', path: rightStr }
      return {
        id: generateId(),
        type: 'condition',
        left,
        comparator: op,
        right,
      }
    }
  }

  // 无法解析，返回默认
  return {
    id: generateId(),
    type: 'condition',
    left: parseExpressionValue(t) ?? { type: 'field', path: t },
    comparator: '==',
  }
}

/**
 * 解析分组表达式（递归）
 */
function parseGroup(expr: string): RuleNode {
  let t = expr.trim()
  if (!t) return createEmptyGroup('and')

  // 检查 not 分组:  !(...)
  if (t.startsWith('!(') && t.endsWith(')')) {
    const inner = t.substring(2, t.length - 1).trim()
    let depth = 0
    let matched = true
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '(') depth++
      else if (inner[i] === ')') depth--
      if (depth < 0) { matched = false; break }
    }
    if (matched && depth === 0) {
      const child = parseGroup(inner)
      return {
        id: generateId(),
        type: 'group',
        operator: 'not',
        children: [child],
      }
    }
  }

  // 剥离最外层括号
  t = stripOuterParens(t)

  // 尝试 || (or)
  const orParts = splitTopLevel(t, '||')
  if (orParts.length > 1) {
    return {
      id: generateId(),
      type: 'group',
      operator: 'or',
      children: orParts.map(parseGroup),
    }
  }

  // 尝试 && (and)
  const andParts = splitTopLevel(t, '&&')
  if (andParts.length > 1) {
    return {
      id: generateId(),
      type: 'group',
      operator: 'and',
      children: andParts.map(parseGroup),
    }
  }

  // 单表达式 → 作为条件
  return parseCondition(t)
}

/**
 * 将 SpEL 表达式字符串解析为 RuleNode 树
 * 支持 group (and/or/not) 和 condition 的逆向转换
 */
export function spelToRuleNode(expression: string): RuleNode {
  const expr = expression.trim()
  if (!expr) return createEmptyGroup('and')
  try {
    return parseGroup(expr)
  } catch (e) {
    console.error('SpEL → RuleNode 解析失败:', e)
    return createEmptyGroup('and')
  }
}


