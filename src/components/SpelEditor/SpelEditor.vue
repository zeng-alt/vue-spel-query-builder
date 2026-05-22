<script setup lang="ts">
/**
 * SpelEditor.vue — SpEL 表达式编辑器
 *
 * 依赖安装：
 *   pnpm add vue-codemirror @codemirror/state @codemirror/view
 *             @codemirror/language @codemirror/autocomplete
 *             @codemirror/commands @lezer/highlight
 *
 * Props:
 *   theme?: 'dark' | 'light'  — 编辑器主题，默认 dark
 */

import { ref, computed, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'

import { EditorView, hoverTooltip, keymap,
         lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
         drawSelection, dropCursor, rectangularSelection,
         crosshairCursor, highlightActiveLine } from '@codemirror/view'
import { EditorState }    from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { foldGutter, indentOnInput, syntaxHighlighting,
         HighlightStyle, StreamLanguage, bracketMatching } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap,
         autocompletion, completionKeymap,
         type Completion, type CompletionSource, CompletionContext } from '@codemirror/autocomplete'
import { tags } from '@lezer/highlight'

import { useSpelEditor } from '../../composables'
import type { SpelEditorProps, SpelEditorEmits, SpelEditorInstance } from '../../types'

// ─── Props / Emits ────────────────────────────────────────────────────────
const props = defineProps<SpelEditorProps>()
const emit  = defineEmits<SpelEditorEmits>()

const { internalValue, validation, handleInput, handleValidate, setValue, getValue, run } =
  useSpelEditor(props, emit)

const cmRef = ref()
const focus = () => cmRef.value?.view?.focus()
defineExpose<SpelEditorInstance>({ getValue, setValue, validate: handleValidate, run, focus })

// ─── 当前主题（默认 dark）────────────────────────────────────────────────
const isDark = computed(() => (props.theme ?? 'dark') === 'dark')

// ─── 容器高度 ─────────────────────────────────────────────────────────────
const containerStyle = computed(() => {
  if (typeof props.height === 'number') return { height: `${props.height}px` }
  if (props.height)                     return { height: props.height }
  return { minHeight: '200px' }
})

// ═══════════════════════════════════════════════════════════════════════════
// 主题色板
// ═══════════════════════════════════════════════════════════════════════════
/**
 * 所有颜色都从这里读取，其余逻辑只引用 THEME.* 变量，
 * 保证切换主题只需改一处。
 */
interface ThemeTokens {
  // 编辑器背景 / 文字
  editorBg      : string
  gutterBg      : string
  gutterBorder  : string
  gutterFg      : string
  contentFg     : string
  activeLine    : string
  activeGutter  : string
  selectionBg   : string
  cursor        : string
  matchBracket  : string
  matchBracketBg: string
  // 语法高亮 token 色
  keyword       : string
  operator      : string
  string        : string
  number        : string
  atom          : string
  variable      : string
  definition    : string
  property      : string
  comment       : string
  // 补全列表
  acBg          : string
  acBorder      : string
  acScrollThumb : string
  acItemFg      : string
  acItemHoverBg : string
  acIconVar     : string; acIconVarBg : string
  acIconProp    : string; acIconPropBg: string
  acIconKey     : string; acIconKeyBg : string
  acIconFn      : string; acIconFnBg  : string
  acLabel       : string
  acLabelHover  : string
  acDetail      : string
  acDetailHover : string
  acDetailBorder: string
  // hover tooltip
  ttBg          : string
  ttBorder      : string
  ttFg          : string
  ttLabelFg     : string
  ttDivider     : string
  ttCodeBg      : string
  ttCodeFg      : string
  ttCodeBorder  : string
  // badge
  badgeVarBg: string; badgeVarFg: string
  badgePropBg:string; badgePropFg:string
  badgeKeyBg: string; badgeKeyFg: string
  badgeFnBg : string; badgeFnFg : string
  // 标题栏
  headerFrom    : string
  headerTo      : string
  // 错误栏
  errBg         : string
  errBorder     : string
  errFg         : string
}

const DARK: ThemeTokens = {
  editorBg      : '#1a1a2e', gutterBg: '#16213e', gutterBorder: '#3e4451',
  gutterFg      : '#5c6370', contentFg: '#e5e5e5',
  activeLine    : 'rgba(97,175,239,.08)', activeGutter: 'rgba(97,175,239,.12)',
  selectionBg   : 'rgba(97,175,239,.3)', cursor: '#61afef',
  matchBracket  : '#e5c07b', matchBracketBg: 'rgba(229,192,107,.15)',
  keyword: '#c678dd', operator: '#e06c75', string: '#98c379',
  number: '#d19a66', atom: '#d19a66', variable: '#61afef',
  definition: '#e6c07b', property: '#98c379', comment: '#5c6370',
  acBg: '#21252b', acBorder: '#3e4451', acScrollThumb: '#4b5263',
  acItemFg: '#abb2bf', acItemHoverBg: 'rgba(97,175,239,.2)',
  acIconVar: '#61afef', acIconVarBg: '#1d3d55',
  acIconProp:'#98c379', acIconPropBg:'#1a3322',
  acIconKey: '#c678dd', acIconKeyBg: '#2d1a3d',
  acIconFn:  '#e5c07b', acIconFnBg:  '#3a2c0a',
  acLabel: '#e5c07b', acLabelHover: '#f5d88a',
  acDetail: '#5c6370', acDetailHover: '#9da5b4', acDetailBorder: '#3e4451',
  ttBg: '#1c2028', ttBorder: '#4b5263', ttFg: '#abb2bf',
  ttLabelFg: '#61afef', ttDivider: '#3e4451',
  ttCodeBg: '#0d1117', ttCodeFg: '#98c379', ttCodeBorder: '#3e4451',
  badgeVarBg:'#1a3a52', badgeVarFg:'#61afef',
  badgePropBg:'#1a3b24',badgePropFg:'#98c379',
  badgeKeyBg:'#2d1a3d', badgeKeyFg:'#c678dd',
  badgeFnBg:'#3b2e0a',  badgeFnFg:'#e5c07b',
  headerFrom: '#4338ca', headerTo: '#7c3aed',
  errBg: 'rgba(127,29,29,.7)', errBorder: '#991b1b', errFg: '#fca5a5',
}

const LIGHT: ThemeTokens = {
  editorBg      : '#fafafa', gutterBg: '#f0f0f0', gutterBorder: '#d1d5db',
  gutterFg      : '#9ca3af', contentFg: '#1f2937',
  activeLine    : 'rgba(59,130,246,.06)', activeGutter: 'rgba(59,130,246,.1)',
  selectionBg   : 'rgba(59,130,246,.2)', cursor: '#2563eb',
  matchBracket  : '#d97706', matchBracketBg: 'rgba(217,119,6,.12)',
  keyword: '#7c3aed', operator: '#dc2626', string: '#16a34a',
  number: '#d97706', atom: '#d97706', variable: '#2563eb',
  definition: '#b45309', property: '#0f766e', comment: '#6b7280',
  acBg: '#ffffff', acBorder: '#e5e7eb', acScrollThumb: '#d1d5db',
  acItemFg: '#374151', acItemHoverBg: 'rgba(59,130,246,.1)',
  acIconVar: '#2563eb', acIconVarBg: '#dbeafe',
  acIconProp:'#0f766e', acIconPropBg:'#ccfbf1',
  acIconKey: '#7c3aed', acIconKeyBg: '#ede9fe',
  acIconFn:  '#b45309', acIconFnBg:  '#fef3c7',
  acLabel: '#92400e', acLabelHover: '#78350f',
  acDetail: '#9ca3af', acDetailHover: '#6b7280', acDetailBorder: '#e5e7eb',
  ttBg: '#ffffff', ttBorder: '#e5e7eb', ttFg: '#4b5563',
  ttLabelFg: '#2563eb', ttDivider: '#e5e7eb',
  ttCodeBg: '#f3f4f6', ttCodeFg: '#16a34a', ttCodeBorder: '#d1d5db',
  badgeVarBg:'#dbeafe', badgeVarFg:'#1d4ed8',
  badgePropBg:'#d1fae5',badgePropFg:'#065f46',
  badgeKeyBg:'#ede9fe', badgeKeyFg:'#6d28d9',
  badgeFnBg:'#fef3c7',  badgeFnFg:'#92400e',
  headerFrom: '#6366f1', headerTo: '#a855f7',
  errBg: 'rgba(254,242,242,.95)', errBorder: '#fca5a5', errFg: '#dc2626',
}

const T = computed<ThemeTokens>(() => isDark.value ? DARK : LIGHT)

// ═══════════════════════════════════════════════════════════════════════════
// 补全列表全局样式（随主题动态更新）
// ═══════════════════════════════════════════════════════════════════════════
const AUTOCOMPLETE_STYLE_ID = 'spel-autocomplete-style'

function injectAutocompleteStyle() {
  let el = document.getElementById(AUTOCOMPLETE_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = AUTOCOMPLETE_STYLE_ID
    document.head.appendChild(el)
  }
  const t = T.value
  el.textContent = `
    .cm-tooltip-autocomplete {
      background    : ${t.acBg} !important;
      border        : 1px solid ${t.acBorder} !important;
      border-radius : 8px !important;
      padding       : 4px !important;
      box-shadow    : 0 12px 40px rgba(0,0,0,.18) !important;
      min-width     : 420px !important;
      max-width     : 560px !important;
    }
    .cm-tooltip-autocomplete > ul {
      max-height    : 300px !important;
      overflow-y    : auto !important;
      overflow-x    : hidden !important;
      scrollbar-width : thin;
      scrollbar-color : ${t.acScrollThumb} ${t.acBg};
    }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar       { width: 5px; }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar-track { background: ${t.acBg}; }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb { background: ${t.acScrollThumb}; border-radius:3px; }

    .cm-tooltip-autocomplete .cm-completionItem {
      display       : flex !important;
      align-items   : center !important;
      gap           : 8px !important;
      padding       : 7px 10px !important;
      border-radius : 5px !important;
      cursor        : pointer !important;
      color         : ${t.acItemFg} !important;
      min-width     : 0 !important;
    }
    .cm-tooltip-autocomplete .cm-completionItem:hover,
    .cm-tooltip-autocomplete .cm-completionItem[aria-selected="true"] {
      background: ${t.acItemHoverBg} !important;
    }
    .cm-completionIcon {
      flex-shrink    : 0 !important;
      width          : 20px !important;
      height         : 20px !important;
      border-radius  : 4px !important;
      display        : flex !important;
      align-items    : center !important;
      justify-content: center !important;
      font-size      : 10px !important;
      font-weight    : 700 !important;
      font-family    : 'Fira Code', monospace !important;
      line-height    : 1 !important;
    }
    .cm-completionIcon.cm-variable { background:${t.acIconVarBg};  color:${t.acIconVar};  }
    .cm-completionIcon.cm-property { background:${t.acIconPropBg}; color:${t.acIconProp}; }
    .cm-completionIcon.cm-keyword  { background:${t.acIconKeyBg};  color:${t.acIconKey};  }
    .cm-completionIcon.cm-function { background:${t.acIconFnBg};   color:${t.acIconFn};   }

    .cm-completionLabel {
      flex          : 1 1 auto !important;
      min-width     : 0 !important;
      overflow      : hidden !important;
      text-overflow : ellipsis !important;
      white-space   : nowrap !important;
      font-family   : 'Fira Code', 'JetBrains Mono', monospace !important;
      font-size     : 13px !important;
      font-weight   : 500 !important;
      color         : ${t.acLabel} !important;
    }
    .cm-completionItem:hover .cm-completionLabel,
    .cm-completionItem[aria-selected="true"] .cm-completionLabel {
      color: ${t.acLabelHover} !important;
    }
    .cm-completionDetail {
      flex          : 0 0 auto !important;
      margin-left   : auto !important;
      padding       : 0 10px 0 14px !important;
      font-size     : 11px !important;
      font-family   : 'Fira Code', monospace !important;
      color         : ${t.acDetail} !important;
      white-space   : nowrap !important;
      max-width     : 160px !important;
      overflow      : hidden !important;
      text-overflow : ellipsis !important;
      border-left   : 1px solid ${t.acDetailBorder} !important;
    }
    .cm-completionItem:hover .cm-completionDetail,
    .cm-completionItem[aria-selected="true"] .cm-completionDetail {
      color: ${t.acDetailHover} !important;
    }
  `
}

// 主题变化时重新注入补全样式
watch(isDark, injectAutocompleteStyle, { immediate: true })

// ═══════════════════════════════════════════════════════════════════════════
// SpEL StreamLanguage 解析器（与主题无关，只定义一次）
// ═══════════════════════════════════════════════════════════════════════════
const SPEL_KEYWORDS    = new Set(['true','false','null','and','or','not','instanceof','matches','new','div','mod'])
const SPEL_BUILTIN_FNS = new Set(['contains','startsWith','endsWith','isEmpty','size','length',
                                   'substring','toUpperCase','toLowerCase','trim'])

const spelLanguage = StreamLanguage.define({
  name: 'spel',

  startState: () => ({}),

  token(stream) {
    if (stream.eatSpace()) return null

    const ch = stream.peek()

    // 单行注释
    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }

    // 字符串
    if (ch === '"' || ch === "'") {
      const q = stream.next()

      if (!q) return null

      let esc = false

      while (!stream.eol()) {
        const c = stream.next()

        if (!c) break

        if (esc) {
          esc = false
          continue
        }

        if (c === '\\') {
          esc = true
          continue
        }

        if (c === q) break
      }

      return 'string'
    }

    // 数字
    if (ch && /\d/.test(ch)) {
      stream.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/)
      return 'number'
    }

    // #变量（locals）
    if (ch === '#') {
      stream.next()
      stream.match(/^[a-zA-Z_]\w*/)
      return 'variable-2'
    }

    // 标识符
    if (ch && /[a-zA-Z_$]/.test(ch)) {
      stream.match(/^[a-zA-Z_$]\w*/)

      const word = stream.current()

      if (SPEL_KEYWORDS.has(word)) {
        return 'keyword'
      }

      if (SPEL_BUILTIN_FNS.has(word)) {
        return 'def'
      }

      if (stream.match(/^\s*\(/, false)) {
        return 'def'
      }

      return 'variable'
    }

    // .属性名
    if (ch === '.') {
      stream.next()

      if (stream.match(/^[a-zA-Z_]\w*/)) {
        return 'property'
      }

      return 'operator'
    }

    // 运算符
    if (ch && /[=!<>&|+\-*/%^~?:]/.test(ch)) {
      const matched = stream.match(
        /^(===|!==|==|!=|<=|>=|&&|\|\||[=!<>&|+\-*/%^~?:])/
      )

      if (!matched) {
        stream.next()
      }

      return 'operator'
    }

    stream.next()

    return null
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// 语法高亮样式（随主题响应式重建）
// ═══════════════════════════════════════════════════════════════════════════
const spelHighlightStyle = computed(() =>
  HighlightStyle.define([
    { tag: tags.keyword,                       color: T.value.keyword   },
    { tag: tags.operator,                      color: T.value.operator  },
    { tag: tags.string,                        color: T.value.string    },
    { tag: tags.number,                        color: T.value.number    },
    { tag: tags.bool,                          color: T.value.atom      },
    { tag: tags.null,                          color: T.value.atom      },
    { tag: tags.atom,                          color: T.value.atom      },
    { tag: tags.variableName,                  color: T.value.variable  },
    { tag: tags.special(tags.variableName),    color: T.value.variable  },
    { tag: tags.definition(tags.variableName), color: T.value.definition},
    { tag: tags.propertyName,                  color: T.value.property  },
    { tag: tags.comment,                       color: T.value.comment, fontStyle: 'italic' },
  ])
)

// ═══════════════════════════════════════════════════════════════════════════
// 编辑器 UI 主题（随主题响应式重建）
// ═══════════════════════════════════════════════════════════════════════════
const spelTheme = computed(() =>
  EditorView.theme({
    '&'                        : { height: '100%', backgroundColor: T.value.editorBg },
    '.cm-scroller'             : { overflow: 'auto', backgroundColor: T.value.editorBg,
                                    fontFamily: "'Fira Code','JetBrains Mono','Monaco','Consolas',monospace",
                                    fontSize: '14px' },
    '.cm-content'              : { caretColor: T.value.cursor, color: T.value.contentFg, padding: '12px' },
    '.cm-line'                 : { color: T.value.contentFg, padding: '2px 0' },
    '.cm-cursor'               : { borderLeftColor: T.value.cursor, borderLeftWidth: '2px' },
    '.cm-selectionBackground'  : { backgroundColor: `${T.value.selectionBg} !important` },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: `${T.value.selectionBg} !important` },
    '.cm-activeLine'           : { backgroundColor: T.value.activeLine },
    '.cm-gutters'              : { backgroundColor: T.value.gutterBg,
                                    borderRight: `1px solid ${T.value.gutterBorder}`, minWidth: '48px' },
    '.cm-lineNumbers .cm-gutterElement': { color: T.value.gutterFg, padding: '0 12px', fontSize: '12px' },
    '.cm-activeLineGutter'     : { backgroundColor: T.value.activeGutter },
    '.cm-matchingBracket'      : { color: `${T.value.matchBracket} !important`,
                                    backgroundColor: T.value.matchBracketBg, fontWeight: 'bold' },
  }, { dark: isDark.value })
)

// ═══════════════════════════════════════════════════════════════════════════
// 补全词典 / hover tooltip 数据
// ═══════════════════════════════════════════════════════════════════════════
interface SpelEntry {
  label : string
  type  : 'variable' | 'property' | 'keyword' | 'function'
  detail: string
  desc  : string
  extra?: string
}

function buildEntries(): SpelEntry[] {
  const list: SpelEntry[] = []

  if (props.authentication) {
    list.push({ label:'authentication', type:'variable', detail:'用户认证信息',
      desc:'存储当前登录用户的认证信息，包含用户名、角色、权限等。',
      extra:'authentication.name  /  authentication.roles' })
    for (const key of Object.keys(props.authentication)) {
      list.push({ label:`authentication.${key}`, type:'property', detail:'authentication 属性',
        desc:`authentication 对象的 ${key} 属性` })
      const val = props.authentication[key]
      if (val && typeof val === 'object')
        for (const sub of Object.keys(val))
          list.push({ label:`authentication.${key}.${sub}`, type:'property', detail:'嵌套属性',
            desc:`authentication.${key} 的 ${sub} 属性` })
    }
  }

  if (props.principal) {
    list.push({ label:'principal', type:'variable', detail:'基础变量信息',
      desc:'业务主体对象，可以是订单、产品、部门等核心业务实体。',
      extra:'principal.id  /  principal.status' })
    for (const key of Object.keys(props.principal)) {
      list.push({ label:`principal.${key}`, type:'property', detail:'principal 属性',
        desc:`principal 对象的 ${key} 属性` })
      const val = props.principal[key]
      if (val && typeof val === 'object')
        for (const sub of Object.keys(val))
          list.push({ label:`principal.${key}.${sub}`, type:'property', detail:'嵌套属性',
            desc:`principal.${key} 的 ${sub} 属性` })
    }
  }

  if (props.locals) {
    for (const key of Object.keys(props.locals)) {
      list.push({ label:`#${key}`, type:'variable', detail:'locals 变量',
        desc:'用户自定义本地变量，使用 # 前缀访问。', extra:`#${key}` })
      const val = props.locals[key]
      if (val && typeof val === 'object')
        for (const sub of Object.keys(val))
          list.push({ label:`#${key}.${sub}`, type:'property', detail:`#${key} 属性`,
            desc:`#${key} 的 ${sub} 属性` })
    }
  }

  ;[
    { label:'true',  detail:'布尔值', desc:'布尔真值。',                                         extra:'principal.active == true'   },
    { label:'false', detail:'布尔值', desc:'布尔假值。',                                         extra:'principal.deleted == false' },
    { label:'null',  detail:'空值',   desc:'表示空引用，常用于判断字段是否存在。',                  extra:'principal.owner != null'    },
    { label:'and',   detail:'逻辑与', desc:'逻辑与，等价于 &&，两侧均为 true 时整体为 true。',     extra:'a > 0 and b > 0'            },
    { label:'or',    detail:'逻辑或', desc:'逻辑或，等价于 ||，任一为 true 时整体为 true。',       extra:'a == 1 or b == 1'           },
    { label:'not',   detail:'逻辑非', desc:'逻辑非，等价于 !，对布尔值取反。',                     extra:'not principal.deleted'      },
  ].forEach(k => list.push({ ...k, type: 'keyword' }))

  ;[
    { label:'contains',   detail:'包含判断',  desc:'判断字符串或集合是否包含指定元素。',         extra:"principal.name.contains('admin')"          },
    { label:'startsWith', detail:'前缀匹配',  desc:'判断字符串是否以指定前缀开头。',             extra:"principal.code.startsWith('ORD')"          },
    { label:'endsWith',   detail:'后缀匹配',  desc:'判断字符串是否以指定后缀结尾。',             extra:"principal.file.endsWith('.pdf')"           },
    { label:'matches',    detail:'正则匹配',  desc:'使用正则表达式匹配字符串，返回 boolean。',    extra:"principal.phone.matches('1[3-9]\\\\d{9}')" },
    { label:'isEmpty',    detail:'判断为空',  desc:'判断字符串或集合长度是否为 0。',              extra:'principal.tags.isEmpty()'                  },
    { label:'size()',     detail:'集合长度',  desc:'返回集合的元素数量。',                        extra:'principal.items.size() > 0'                },
    { label:'length()',   detail:'字符串长度', desc:'返回字符串的字符数量。',                     extra:'principal.name.length() > 2'               },
  ].forEach(f => list.push({ ...f, type: 'function' }))

  return list
}

// ═══════════════════════════════════════════════════════════════════════════
// 类型推断辅助：从 props 数据模型中构建 path → type 映射
// ═══════════════════════════════════════════════════════════════════════════
function buildTypeMap(): Record<string, string> {
  const map: Record<string, string> = {}

  function walk(obj: any, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key
      const val = obj[key]
      if (val === null || val === undefined) {
        map[fullPath] = 'null'
      } else if (Array.isArray(val)) {
        map[fullPath] = 'array'
      } else if (typeof val === 'object') {
        map[fullPath] = 'object'
        walk(val, fullPath)
      } else {
        map[fullPath] = typeof val
      }
    }
  }

  if (props.authentication) walk(props.authentication, 'authentication')
  if (props.principal)      walk(props.principal, 'principal')

  if (props.locals) {
    for (const key of Object.keys(props.locals)) {
      const fullPath = `#${key}`
      const val = props.locals[key]
      if (val === null || val === undefined) {
        map[fullPath] = 'null'
      } else if (Array.isArray(val)) {
        map[fullPath] = 'array'
      } else if (typeof val === 'object') {
        map[fullPath] = 'object'
        walk(val, fullPath)
      } else {
        map[fullPath] = typeof val
      }
    }
  }

  return map
}

// ═══════════════════════════════════════════════════════════════════════════
// 字符串方法补全条目（上下文感知：在已知字符串属性后 . 触发）
// ═══════════════════════════════════════════════════════════════════════════
function buildStringMethodEntries(): SpelEntry[] {
  return [
    { label:'length',        type:'property', detail:'字符串长度',     desc:'返回字符串的字符数量。(属性访问，无需括号)',   extra:'principal.name.length'                                                  },
    { label:'isEmpty()',    type:'function', detail:'判断为空',       desc:'判断字符串或集合长度是否为 0。',             extra:'principal.name.isEmpty()'                                               },
    { label:'toUpperCase()',type:'function', detail:'转大写',         desc:'将字符串转换为大写。',                       extra:'principal.name.toUpperCase()'                                           },
    { label:'toLowerCase()',type:'function', detail:'转小写',         desc:'将字符串转换为小写。',                       extra:'principal.name.toLowerCase()'                                           },
    { label:'trim()',       type:'function', detail:'去除空格',       desc:'去除字符串首尾空白字符。',                   extra:'principal.name.trim()'                                                  },
    { label:'substring(x)', type:'function', detail:'子串截取(1参)',  desc:'从指定位置截取到末尾的子字符串。',           extra:'principal.name.substring(3)'                                            },
    { label:'substring(x,y)',type:'function',detail:'子串截取(2参)',  desc:'从起始位置截取到结束位置的子字符串。',       extra:'principal.name.substring(0, 3)'                                          },
    { label:'replace(x,y)', type:'function', detail:'字符串替换',     desc:'将字符串中的指定字符替换为新字符。',          extra:"principal.name.replace('old', 'new')"                                    },
    { label:'startsWith(x)',type:'function', detail:'前缀匹配',       desc:'判断字符串是否以指定前缀开头。',             extra:"principal.name.startsWith('prefix')"                                    },
    { label:'endsWith(x)',  type:'function', detail:'后缀匹配',       desc:'判断字符串是否以指定后缀结尾。',             extra:"principal.name.endsWith('suffix')"                                      },
    { label:'contains(x)',  type:'function', detail:'包含判断',       desc:'判断字符串是否包含指定子串。',               extra:"principal.name.contains('value')"                                       },
    { label:'indexOf(x)',   type:'function', detail:'查找索引',       desc:'返回指定字符在字符串中首次出现的位置索引。', extra:"principal.name.indexOf('a')"                                            },
    { label:'charAt(x)',    type:'function', detail:'获取字符',       desc:'返回字符串指定位置的字符。',                 extra:'principal.name.charAt(0)'                                               },
  ]
}


// ═══════════════════════════════════════════════════════════════════════════
// hoverTooltip DOM 构建（读取当前主题内联样式）
// ═══════════════════════════════════════════════════════════════════════════
function buildHoverTooltipDom(entry: SpelEntry): HTMLElement {
  const t = T.value

  const BADGE: Record<string, { bg: string; fg: string; text: string }> = {
    variable : { bg: t.badgeVarBg,  fg: t.badgeVarFg,  text: 'VAR'  },
    property : { bg: t.badgePropBg, fg: t.badgePropFg, text: 'PROP' },
    keyword  : { bg: t.badgeKeyBg,  fg: t.badgeKeyFg,  text: 'KEY'  },
    function : { bg: t.badgeFnBg,   fg: t.badgeFnFg,   text: 'FN'   },
  }
  const badge = BADGE[entry.type] ?? { bg: t.acBg, fg: t.acItemFg, text: entry.type.toUpperCase() }

  const root = document.createElement('div')
  Object.assign(root.style, {
    padding: '12px 14px', minWidth: '240px', maxWidth: '320px',
    background: t.ttBg, border: `1px solid ${t.ttBorder}`,
    borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
    fontFamily: "'Fira Code','JetBrains Mono','Consolas',monospace",
    fontSize: '12px', lineHeight: '1.6', color: t.ttFg,
    zIndex: '9999', boxSizing: 'border-box',
  })

  // 标题行
  const header = document.createElement('div')
  Object.assign(header.style, { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'8px' })

  const labelEl = document.createElement('span')
  labelEl.textContent = entry.label
  Object.assign(labelEl.style, { fontWeight:'600', fontSize:'13px', color: t.ttLabelFg,
    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' })

  const badgeEl = document.createElement('span')
  badgeEl.textContent = badge.text
  Object.assign(badgeEl.style, { flexShrink:'0', fontSize:'10px', fontWeight:'700',
    padding:'2px 6px', borderRadius:'3px', letterSpacing:'.5px',
    background: badge.bg, color: badge.fg })

  header.appendChild(labelEl)
  header.appendChild(badgeEl)

  // 分隔线
  const divider = document.createElement('div')
  Object.assign(divider.style, { height:'1px', background: t.ttDivider, marginBottom:'8px' })

  // 描述
  const descEl = document.createElement('div')
  descEl.textContent = entry.desc
  Object.assign(descEl.style, { fontSize:'12px', color: t.ttFg, lineHeight:'1.65', wordBreak:'break-word' })

  root.appendChild(header)
  root.appendChild(divider)
  root.appendChild(descEl)

  if (entry.extra) {
    const extra = document.createElement('div')
    extra.textContent = entry.extra
    Object.assign(extra.style, { marginTop:'8px', padding:'6px 8px', background: t.ttCodeBg,
      borderRadius:'4px', fontSize:'11px', color: t.ttCodeFg, lineHeight:'1.6',
      borderLeft: `2px solid ${t.ttCodeBorder}`, wordBreak:'break-all' })
    root.appendChild(extra)
  }

  return root
}

// ─── token 提取辅助 ───────────────────────────────────────────────────────
function getTokenAt(doc: { sliceString(a:number,b:number):string; length:number }, pos: number) {
  const line = doc.sliceString(Math.max(0, pos - 100), Math.min(doc.length, pos + 100))
  const offset = Math.min(pos, 100)
  let start = offset
  while (start > 0) {
    const ch = line[start - 1]

    if (!ch || !/[#\w.]/.test(ch)) break

    start--
  }
  let end = offset
  while (end < line.length) {
    const ch = line[end]
    if (!ch || !/[\w.(]/.test(ch)) break
    end++
  }
  const text = line.slice(start, end).replace(/\(.*$/, '')
  if (!text) return null
  return { from: pos - (offset - start), to: pos + (end - offset), text }
}

// ─── hoverTooltip 扩展（每次主题变化重新创建，保证 DOM 用新主题色）────────
const spelHoverTooltip = computed(() =>
  hoverTooltip(
    (view, pos) => {
      const token = getTokenAt(view.state.doc, pos)
      if (!token) return null
      const entry = buildEntries().find(e => e.label === token.text)
      if (!entry) return null
      return {
        pos: token.from, end: token.to, above: true,
        create: () => ({ dom: buildHoverTooltipDom(entry) }),
      }
    },
    { hoverTime: 300 },
  )
)

// ─── 自动补全源 ───────────────────────────────────────────────────────────
const spelCompletionSource: CompletionSource = (ctx: CompletionContext) => {
  const word = ctx.matchBefore(/[#a-zA-Z_][\w#.]*/)

  // ── 1) 尝试字面量字符串上下文：'hello'. 或 "hello". ────────────
  const pos = ctx.pos
  const beforeText = ctx.state.sliceDoc(Math.max(0, pos - 200), pos)
  const slPattern = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\.([\w]*)$/
  const slMatch = beforeText.match(slPattern)
  if (slMatch) {
    const partialMethod = slMatch[2] ?? '' // 点号后已输入的部分方法名
    const dotPos = pos - partialMethod.length - 1
    const replaceFrom = dotPos + 1 // 从 '.' 之后开始替换，保留字面量
    const lowerPartial = partialMethod.toLowerCase()
    const options: Completion[] = buildStringMethodEntries()
      .filter(e => e.label.toLowerCase().startsWith(lowerPartial))
      .map(e => ({ label: e.label, type: e.type, detail: e.detail }))
    return { from: replaceFrom, options }
  }

  // ── 2) 没有有效匹配则退出 ──────────────────────────────────────
  if (!word || (word.from === word.to && !ctx.explicit)) return null

  const text = word.text

  // ── 3) 上下文感知：已知字符串属性后输入 '.' 触发方法提示 ───────
  const dotIndex = text.lastIndexOf('.')
  if (dotIndex > 0) {
    const basePath = text.slice(0, dotIndex)
    const partialMethod = text.slice(dotIndex + 1)
    const typeMap = buildTypeMap()
    if (typeMap[basePath] === 'string') {
      const lowerPartial = partialMethod.toLowerCase()
      const options: Completion[] = buildStringMethodEntries()
        .filter(e => e.label.toLowerCase().startsWith(lowerPartial))
        .map(e => ({
          label: e.label, type: e.type, detail: e.detail,
        }))
      // from 从 '.' 之后开始，这样选择补全后保留 basePath
      return { from: word.from + dotIndex + 1, options }
    }
  }

  // ── 4) 默认：全局条目前缀过滤 ─────────────────────────────────
  const lower = text.toLowerCase()
  const options: Completion[] = buildEntries()
    .filter(e => e.label.toLowerCase().startsWith(lower))
    .map(e => ({
      label: e.label, type: e.type, detail: e.detail,
      apply: (view: EditorView) =>
        view.dispatch({ changes: { from: word.from, to: word.to, insert: e.label } }),
    }))
  return { from: word.from, options }
}

// ═══════════════════════════════════════════════════════════════════════════
// vue-codemirror extensions（computed，主题切换时整体重建）
// ═══════════════════════════════════════════════════════════════════════════
const extensions = computed(() => [
  lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(),
  history(), foldGutter(), drawSelection(), dropCursor(),
  EditorState.allowMultipleSelections.of(true), indentOnInput(),
  bracketMatching(), closeBrackets(), rectangularSelection(),
  crosshairCursor(), highlightActiveLine(),

  keymap.of([
    ...closeBracketsKeymap, ...defaultKeymap,
    ...historyKeymap, ...completionKeymap,
  ]),

  spelLanguage,
  // 每次主题变化，computed 返回新的 HighlightStyle 实例
  syntaxHighlighting(spelHighlightStyle.value),

  autocompletion({
    override: [spelCompletionSource],
    defaultKeymap: true, closeOnBlur: false, activateOnTyping: true,
  }),

  // 每次主题变化，computed 返回新的 hoverTooltip 实例（内联样式用新主题色）
  spelHoverTooltip.value,

  // 每次主题变化，computed 返回新的 EditorView.theme 实例
  spelTheme.value,

  EditorView.lineWrapping,
])

// ─── 同步 modelValue → 编辑器 ─────────────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  if (!cmRef.value?.view) return
  const view = cmRef.value.view as EditorView
  if (view.state.doc.toString() !== newVal)
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newVal } })
})
</script>

<template>
  <div
    class="spel-editor-wrap rounded-lg overflow-hidden shadow-lg"
    :class="isDark ? 'border-gray-700' : 'border-gray-200'"
    :style="[containerStyle, { borderWidth: '1px', borderStyle: 'solid' }]"
  >
    <!-- 标题栏（渐变随主题变化）-->
    <div
      class="flex items-center justify-between px-4 py-2 select-none"
      :style="{
        background: `linear-gradient(to right, ${T.headerFrom}, ${T.headerTo})`
      }"
    >
      <span class="flex items-center gap-2 text-white text-sm font-medium">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
        SpEL Editor
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-red-400/80"/>
        <span class="w-2.5 h-2.5 rounded-full bg-yellow-400/80"/>
        <span class="w-2.5 h-2.5 rounded-full bg-green-400/80"/>
      </span>
    </div>

    <!-- vue-codemirror -->
    <Codemirror
      ref="cmRef"
      v-model="internalValue"
      :extensions="extensions"
      :autofocus="false"
      :indent-with-tab="true"
      :tab-size="2"
      class="spel-cm-wrap"
      @change="handleInput"
    />

    <!-- 校验错误提示 -->
    <Transition name="spel-err">
      <div
        v-if="!validation.valid"
        class="flex items-center gap-2 px-4 py-2 text-sm border-t"
        :style="{
          background  : T.errBg,
          borderColor : T.errBorder,
          color       : T.errFg,
        }"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667
                   1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34
                   16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        {{ validation.error }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.spel-editor-wrap {
  display       : flex;
  flex-direction: column;
}
.spel-cm-wrap {
  flex    : 1;
  overflow: hidden;
}
:deep(.cm-editor) {
  height: 100%;
}
:deep(.cm-editor.cm-focused) {
  outline: none;
}
:deep(.cm-scroller) {
  overflow: auto;
}
.spel-err-enter-active,
.spel-err-leave-active { transition: all .2s ease; }
.spel-err-enter-from,
.spel-err-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
