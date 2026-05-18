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

export interface RuleNode {
  id: string
  type: 'group' | 'condition'
  operator?: 'and' | 'or'
  field?: string
  comparator?: string
  value?: any
  children?: RuleNode[]
}

export interface RuleTreeProps {
  modelValue: RuleNode
  context?: Record<string, any>
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
