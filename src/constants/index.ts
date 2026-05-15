import type { Comparator } from '../types'

export const DEFAULT_COMPARATORS: Comparator[] = [
  { value: '==', label: '等于', types: ['string', 'number', 'boolean', 'date'] },
  { value: '!=', label: '不等于', types: ['string', 'number', 'boolean', 'date'] },
  { value: '>', label: '大于', types: ['number', 'date'] },
  { value: '>=', label: '大于等于', types: ['number', 'date'] },
  { value: '<', label: '小于', types: ['number', 'date'] },
  { value: '<=', label: '小于等于', types: ['number', 'date'] },
  { value: 'contains', label: '包含', types: ['string'] },
  { value: 'startsWith', label: '开头', types: ['string'] },
  { value: 'endsWith', label: '结尾', types: ['string'] },
  { value: 'matches', label: '正则匹配', types: ['string'] },
  { value: 'in', label: '在列表中', types: ['string', 'number'] },
  { value: 'not in', label: '不在列表中', types: ['string', 'number'] },
  { value: 'isEmpty', label: '为空', types: ['string', 'array', 'object'] },
  { value: 'isNotEmpty', label: '不为空', types: ['string', 'array', 'object'] },
]

export const GROUP_OPERATORS = [
  { value: 'and', label: '且' },
  { value: 'or', label: '或' },
]

export const EDITOR_THEME = 'one-dark'

export const EDITOR_DEFAULT_HEIGHT = '400px'

export const RULE_TREE_DEFAULT_HEIGHT = '500px'
