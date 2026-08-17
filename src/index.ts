export { spelService } from './spel-service'
export { SpelEditor, RuleTree, SpelConfigProvider } from './components'
export type {
  SpelEditorProps,
  SpelEditorEmits,
  SpelEditorInstance,
  RuleTreeProps,
  RuleTreeEmits,
  RuleTreeInstance,
  RuleNode,
  CustomMethod,
  CustomMethodParam,
  ContextVariable,
  Comparator,
  ComponentSize,
  SpelLocale,
  SpelMessages,
} from './types'
export { useSpelEditor, useRuleTree, useSpelI18n } from './composables'
export {
  validateSpelExpression,
  evalSpelExpression,
  ruleNodeToSpel,
  spelToRuleNode,
  createEmptyCondition,
  createEmptyGroup,
  generateId,
} from './utils'
export {
  DEFAULT_COMPARATORS,
  GROUP_OPERATORS,
  EDITOR_THEME,
  EDITOR_DEFAULT_HEIGHT,
  RULE_TREE_DEFAULT_HEIGHT,
} from './constants'
export {
  setLocale,
  setLocaleFallback,
  setLocaleMessages,
  getLocale,
  getLocaleFallback,
  t,
  resolveNaiveLocale,
  resolveNaiveDateLocale,
  provideSpelConfig,
  useSpelConfig,
  type SpelConfigContext,
  type Messages,
} from './locales'

