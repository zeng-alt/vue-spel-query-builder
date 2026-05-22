/**
 * 补全条目接口
 */
export interface SpelEntry {
  label: string
  type: 'variable' | 'property' | 'keyword' | 'function'
  detail: string
  desc: string
  extra?: string
}

/**
 * 对象数组元素中的递归字段
 */
export interface ElementField {
  label: string
  value: string
  type: string // 'string' | 'number' | 'boolean' | 'object' | 'array'
  children?: ElementField[] // 嵌套对象的子字段
  elementType?: string // 数组字段的元素类型
  elementFields?: ElementField[] // 对象数组字段的元素字段列表
}

/**
 * 数组元信息（路径 → 元素类型/字段）
 */
export interface ArrayMeta {
  elementType: string // 'string' | 'number' | 'object'
  elementFields?: ElementField[] // 对象数组时，元素对象的递归字段树
}

/**
 * 编辑器主题色板
 */
export interface ThemeTokens {
  editorBg: string
  gutterBg: string
  gutterBorder: string
  gutterFg: string
  contentFg: string
  activeLine: string
  activeGutter: string
  selectionBg: string
  cursor: string
  matchBracket: string
  matchBracketBg: string
  keyword: string
  operator: string
  string: string
  number: string
  atom: string
  variable: string
  definition: string
  property: string
  comment: string
  acBg: string
  acBorder: string
  acScrollThumb: string
  acItemFg: string
  acItemHoverBg: string
  acIconVar: string; acIconVarBg: string
  acIconProp: string; acIconPropBg: string
  acIconKey: string; acIconKeyBg: string
  acIconFn: string; acIconFnBg: string
  acLabel: string
  acLabelHover: string
  acDetail: string
  acDetailHover: string
  acDetailBorder: string
  ttBg: string
  ttBorder: string
  ttFg: string
  ttLabelFg: string
  ttDivider: string
  ttCodeBg: string
  ttCodeFg: string
  ttCodeBorder: string
  badgeVarBg: string; badgeVarFg: string
  badgePropBg: string; badgePropFg: string
  badgeKeyBg: string; badgeKeyFg: string
  badgeFnBg: string; badgeFnFg: string
  headerFrom: string
  headerTo: string
  errBg: string
  errBorder: string
  errFg: string
}
