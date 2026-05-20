export interface SpelEditorProps {
  modelValue: string
  authentication?: Record<string, any>
  principal?: Record<string, any>
  locals?: Record<string, any>
  disabled?: boolean
  readonly?: boolean
  height?: string | number
  theme?: 'dark' | 'light'
}

export interface SpelEditorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'validate', isValid: boolean, error?: string): void
  (e: 'run', result: any, error?: string): void
}

// ─── Function Argument ───────────────────────────────────────────────────────
// Represents the argument passed to a method that requires one.
// Can be a literal value, a field reference, or a nested method call.
export interface FunctionArgument {
  type: 'value' | 'field' | 'function'
  value?: string // literal string / field path / method name
  functionArgument?: FunctionArgument // nested arg when type === 'function'
}

// ─── Value source ────────────────────────────────────────────────────────────
export type ValueSource = 'value' | 'field' | 'function'

// ─── Field source ────────────────────────────────────────────────────────────
// 'field'    → plain field reference,  e.g.  authentication.userId
// 'function' → field + method call,    e.g.  authentication.userId.length()
export type FieldSource = 'field' | 'function'

// ─── Logical operator ────────────────────────────────────────────────────────
export type LogicalOperator = 'and' | 'or' | 'not'

// ─── Field option (for cascader) ─────────────────────────────────────────────
export interface FieldOption {
  label: string
  value: string | number
  type?: string
  children?: FieldOption[]
  elementType?: string
  elementChildren?: FieldOption[] // 如果元素是对象，其内部字段树
}

export type Expression =
  | { type: 'literal'; value: string; literalType?: string } // 字面量，如 'admin'
  | { type: 'field'; path: string } // 字段引用，如 authentication.name
  | { type: 'function'; call: FunctionCall } // 函数调用

// ── 函数调用：方法名 + 作用对象 + 实参列表 ──
// types/rule.ts

export interface FunctionCall {
  method: string
  base?: Expression // ← 改为可选，无调用方时省略
  args: Expression[]
}

export interface FunctionDef {
  label: string
  value: string
  argumentCount: number
  hasBase: boolean
  baseType?: string
  returnType?: string
}

export interface ListFilter {
  comparator: string
  value?: Expression // 右侧值（字面量），可选
  fieldPath?: string // 对象元素时选择的字段路径
}

// ─── Rule node ───────────────────────────────────────────────────────────────
export interface RuleNode {
  id: string
  type: 'condition' | 'group'

  // ── Group-only ──────────────────────────────────────────────────────────
  operator?: LogicalOperator
  children?: RuleNode[]

  // 条件左侧表达式（必有）
  left?: Expression

  // 比较符
  comparator?: string

  // 条件右侧表达式（isEmpty / isNotEmpty 时可省略）
  right?: Expression

  listFilter?: ListFilter // 列表筛选条件
}

export interface RuleTreeProps {
  modelValue: RuleNode
  authentication?: Record<string, any>
  principal?: Record<string, any>
  locals?: Record<string, any>
  disabled?: boolean
}

export interface RuleTreeEmits {
  (e: 'update:modelValue', value: RuleNode): void
  (e: 'change', value: RuleNode): void
}

export interface ContextVariable {
  name: string
  type: string
  description?: string
}

export interface Comparator {
  value: string
  label: string
  types: string[]
}

export interface SpelEditorInstance {
  getValue: () => string
  setValue: (value: string) => void
  validate: () => Promise<boolean>
  run: () => Promise<any>
  focus: () => void
}

export interface RuleTreeInstance {
  getSpelExpression: () => string
  setSpelExpression: (expression: string) => void
  validate: () => boolean
}
