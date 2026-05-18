<script setup lang="ts">
/**
 * SpelEditor.vue — SpEL 表达式编辑器
 *
 * 依赖安装：
 *   pnpm add vue-codemirror @codemirror/state @codemirror/view
 *             @codemirror/language @codemirror/autocomplete
 *             @codemirror/commands @lezer/highlight
 *
 * 【浮窗方案】hoverTooltip（@codemirror/view）
 *   - 鼠标悬停编辑器内的 token 时触发，通过查词典匹配补全项，
 *     返回自定义 DOM 节点作为 tooltip 内容。
 *   - tooltip 由 CM 挂在 document.body，但内联样式直接写在 DOM 节点上，
 *     无需全局 CSS 也能正确渲染。
 *   - 废弃旧方案：autocompletion info 函数 + 全局 <style> 注入。
 *
 * 【高亮方案】StreamLanguage 自定义 SpEL tokenizer
 *   - token() 逐字符扫描 → 返回 token 类名 → 映射 Lezer tag → HighlightStyle 着色
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

// ─── 编辑器实例引用 ────────────────────────────────────────────────────────
const cmRef = ref()
const focus = () => cmRef.value?.view?.focus()
defineExpose<SpelEditorInstance>({ getValue, setValue, validate: handleValidate, run, focus })

// ─── 容器高度 ─────────────────────────────────────────────────────────────
const containerStyle = computed(() => {
  if (typeof props.height === 'number') return { height: `${props.height}px` }
  if (props.height)                     return { height: props.height }
  return { minHeight: '200px' }
})

// ─── 补全列表全局样式注入 ─────────────────────────────────────────────────
// 补全下拉列表（.cm-tooltip-autocomplete）挂在 body，scoped 无效，
// 只注入补全列表相关样式；hover tooltip 改用内联样式，不再需要全局注入。
const AUTOCOMPLETE_STYLE_ID = 'spel-autocomplete-style'

function injectAutocompleteStyle() {
  if (document.getElementById(AUTOCOMPLETE_STYLE_ID)) return
  const el = document.createElement('style')
  el.id = AUTOCOMPLETE_STYLE_ID
  el.textContent = `
    .cm-tooltip-autocomplete {
      background    : #21252b !important;
      border        : 1px solid #3e4451 !important;
      border-radius : 8px !important;
      padding       : 4px !important;
      box-shadow    : 0 12px 40px rgba(0,0,0,.55) !important;
      min-width     : 420px !important;
      max-width     : 560px !important;
    }
    .cm-tooltip-autocomplete > ul {
      max-height    : 300px !important;
      overflow-y    : auto !important;
      overflow-x    : hidden !important;
      scrollbar-width : thin;
      scrollbar-color : #4b5263 #21252b;
    }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar       { width: 5px; }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar-track { background: #21252b; }
    .cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb { background: #4b5263; border-radius: 3px; }

    .cm-tooltip-autocomplete .cm-completionItem {
      display       : flex !important;
      align-items   : center !important;
      gap           : 8px !important;
      padding       : 7px 10px !important;
      border-radius : 5px !important;
      cursor        : pointer !important;
      color         : #abb2bf !important;
      min-width     : 0 !important;
    }
    .cm-tooltip-autocomplete .cm-completionItem:hover,
    .cm-tooltip-autocomplete .cm-completionItem[aria-selected="true"] {
      background: rgba(97,175,239,.2) !important;
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
    .cm-completionIcon.cm-variable { background:#1d3d55; color:#61afef; }
    .cm-completionIcon.cm-property { background:#1a3322; color:#98c379; }
    .cm-completionIcon.cm-keyword  { background:#2d1a3d; color:#c678dd; }
    .cm-completionIcon.cm-function { background:#3a2c0a; color:#e5c07b; }

    .cm-completionLabel {
      flex          : 1 1 auto !important;
      min-width     : 0 !important;
      overflow      : hidden !important;
      text-overflow : ellipsis !important;
      white-space   : nowrap !important;
      font-family   : 'Fira Code', 'JetBrains Mono', monospace !important;
      font-size     : 13px !important;
      font-weight   : 500 !important;
      color         : #e5c07b !important;
    }
    .cm-completionItem:hover .cm-completionLabel,
    .cm-completionItem[aria-selected="true"] .cm-completionLabel {
      color: #f5d88a !important;
    }
    .cm-completionDetail {
      flex          : 0 0 auto !important;
      margin-left   : auto !important;
      padding       : 0 10px 0 14px !important;
      font-size     : 11px !important;
      font-family   : 'Fira Code', monospace !important;
      color         : #5c6370 !important;
      white-space   : nowrap !important;
      max-width     : 160px !important;
      overflow      : hidden !important;
      text-overflow : ellipsis !important;
      border-left   : 1px solid #3e4451 !important;
    }
    .cm-completionItem:hover .cm-completionDetail,
    .cm-completionItem[aria-selected="true"] .cm-completionDetail {
      color: #9da5b4 !important;
    }
  `
  document.head.appendChild(el)
}

// ─── SpEL StreamLanguage 解析器 ───────────────────────────────────────────
// token 返回值  → Lezer tag                        → 颜色
// "keyword"    → tags.keyword                      → #c678dd 紫
// "operator"   → tags.operator                     → #e06c75 红
// "string"     → tags.string                       → #98c379 绿
// "number"     → tags.number                       → #d19a66 橙
// "atom"       → tags.atom (true/false/null)       → #d19a66 橙
// "variable"   → tags.variableName                 → #61afef 蓝
// "variable-2" → tags.special(tags.variableName)   → #61afef 蓝（# 前缀）
// "property"   → tags.propertyName                 → #98c379 绿
// "def"        → tags.definition(variableName)     → #e6c07b 黄（函数）
// "comment"    → tags.comment                      → #5c6370 灰斜体
const SPEL_KEYWORDS    = new Set(['true','false','null','and','or','not','instanceof','matches','new','div','mod'])
const SPEL_BUILTIN_FNS = new Set(['contains','startsWith','endsWith','isEmpty','size','length',
                                   'substring','toUpperCase','toLowerCase','trim','abs','round','floor','ceil'])

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

// ─── 语法高亮 ─────────────────────────────────────────────────────────────
const spelHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword,                        color: '#c678dd' },
  { tag: tags.operator,                       color: '#e06c75' },
  { tag: tags.string,                         color: '#98c379' },
  { tag: tags.number,                         color: '#d19a66' },
  { tag: tags.bool,                           color: '#d19a66' },
  { tag: tags.null,                           color: '#d19a66' },
  { tag: tags.atom,                           color: '#d19a66' },
  { tag: tags.variableName,                   color: '#61afef' },
  { tag: tags.special(tags.variableName),     color: '#61afef' },
  { tag: tags.definition(tags.variableName),  color: '#e6c07b' },
  { tag: tags.propertyName,                   color: '#98c379' },
  { tag: tags.comment,                        color: '#5c6370', fontStyle: 'italic' },
])

// ─── 编辑器主题 ───────────────────────────────────────────────────────────
const spelTheme = EditorView.theme({
  '&'                        : { height: '100%', backgroundColor: '#1a1a2e' },
  '.cm-scroller'             : { overflow: 'auto', backgroundColor: '#1a1a2e',
                                  fontFamily: "'Fira Code','JetBrains Mono','Monaco','Consolas',monospace",
                                  fontSize: '14px' },
  '.cm-content'              : { caretColor: '#61afef', color: '#e5e5e5', padding: '12px' },
  '.cm-line'                 : { color: '#e5e5e5', padding: '2px 0' },
  '.cm-cursor'               : { borderLeftColor: '#61afef', borderLeftWidth: '2px' },
  '.cm-selectionBackground'  : { backgroundColor: 'rgba(97,175,239,.3) !important' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(97,175,239,.3) !important' },
  '.cm-activeLine'           : { backgroundColor: 'rgba(97,175,239,.08)' },
  '.cm-gutters'              : { backgroundColor: '#16213e', borderRight: '1px solid #3e4451', minWidth: '48px' },
  '.cm-lineNumbers .cm-gutterElement': { color: '#5c6370', padding: '0 12px', fontSize: '12px' },
  '.cm-activeLineGutter'     : { backgroundColor: 'rgba(97,175,239,.12)' },
  '.cm-matchingBracket'      : { color: '#e5c07b !important', backgroundColor: 'rgba(229,192,107,.15)', fontWeight: 'bold' },
}, { dark: true })

// ─── 补全词典（同时作为 hoverTooltip 的数据源）────────────────────────────
interface SpelEntry {
  label   : string
  type    : 'variable' | 'property' | 'keyword' | 'function'
  detail  : string   // 右侧简短说明（补全列表内联）
  desc    : string   // 详细描述（hover tooltip 正文）
  extra?  : string   // 示例代码（hover tooltip 代码块）
}

const BADGE_MAP: Record<string, { bg: string; fg: string; text: string }> = {
  variable : { bg: '#1a3a52', fg: '#61afef', text: 'VAR'  },
  property : { bg: '#1a3b24', fg: '#98c379', text: 'PROP' },
  keyword  : { bg: '#2d1a3d', fg: '#c678dd', text: 'KEY'  },
  function : { bg: '#3b2e0a', fg: '#e5c07b', text: 'FN'   },
}

function buildEntries(): SpelEntry[] {
  const list: SpelEntry[] = []

  // authentication
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

  // principal
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

  // locals
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

  // 内置关键字
  ;[
    { label:'true',  detail:'布尔值', desc:'布尔真值。',                                          extra:'principal.active == true'  },
    { label:'false', detail:'布尔值', desc:'布尔假值。',                                          extra:'principal.deleted == false' },
    { label:'null',  detail:'空值',   desc:'表示空引用，常用于判断字段是否存在。',                   extra:'principal.owner != null'   },
    { label:'and',   detail:'逻辑与', desc:'逻辑与运算，等价于 &&，两侧均为 true 时结果为 true。',  extra:'a > 0 and b > 0'           },
    { label:'or',    detail:'逻辑或', desc:'逻辑或运算，等价于 ||，任一为 true 时结果为 true。',    extra:'a == 1 or b == 1'          },
    { label:'not',   detail:'逻辑非', desc:'逻辑非运算，等价于 !，对布尔值取反。',                  extra:'not principal.deleted'     },
  ].forEach(k => list.push({ ...k, type: 'keyword' }))

  // 内置函数
  ;[
    { label:'contains',   detail:'包含判断', desc:'判断字符串或集合是否包含指定元素。',          extra:"principal.name.contains('admin')"    },
    { label:'startsWith', detail:'前缀匹配', desc:'判断字符串是否以指定前缀开头。',              extra:"principal.code.startsWith('ORD')"   },
    { label:'endsWith',   detail:'后缀匹配', desc:'判断字符串是否以指定后缀结尾。',              extra:"principal.file.endsWith('.pdf')"    },
    { label:'matches',    detail:'正则匹配', desc:'使用正则表达式匹配字符串，返回 boolean。',     extra:"principal.phone.matches('1[3-9]\\\\d{9}')" },
    { label:'isEmpty',    detail:'判断为空', desc:'判断字符串或集合长度是否为 0。',               extra:'principal.tags.isEmpty()'           },
    { label:'size()',     detail:'集合长度', desc:'返回集合的元素数量。',                         extra:'principal.items.size() > 0'         },
    { label:'length()',   detail:'字符串长度',desc:'返回字符串的字符数量。',                      extra:'principal.name.length() > 2'        },
  ].forEach(f => list.push({ ...f, type: 'function' }))

  return list
}

// ─── hoverTooltip：鼠标悬停显示详情浮窗 ──────────────────────────────────
/**
 * hoverTooltip(source, options) 注册一个悬停处理器。
 *
 * source(view, pos, side) 在鼠标停留超过 hoverTime 后调用：
 *   - pos  : 鼠标所在的文档字符位置
 *   - side : -1（左）或 1（右），表示鼠标在字符的哪一侧
 *   - 返回 { pos, end, above, create } 或 null（不显示）
 *
 * create(view) 返回 { dom }，dom 即渲染到 tooltip 里的节点。
 * tooltip 由 CM 负责定位和挂载，无需手动管理位置。
 *
 * 【为什么用 hoverTooltip 而不是 autocompletion info】
 *   autocompletion 的 info 函数只在补全列表打开时显示，
 *   而 hoverTooltip 在编辑器任意位置悬停都可触发，更符合"查看变量说明"的使用场景。
 *   同时 hoverTooltip 的 dom 节点由我们完全控制，可以写内联样式，
 *   不依赖全局 CSS 即可正确渲染。
 */
function buildHoverTooltipDom(entry: SpelEntry): HTMLElement {
  const badge = BADGE_MAP[entry.type] ?? { bg: '#2a2a2a', fg: '#abb2bf', text: entry.type.toUpperCase() }

  // 外层容器
  const root = document.createElement('div')
  Object.assign(root.style, {
    padding         : '12px 14px',
    minWidth        : '240px',
    maxWidth        : '320px',
    background      : '#1c2028',
    border          : '1px solid #4b5263',
    borderRadius    : '8px',
    boxShadow       : '0 8px 32px rgba(0,0,0,.65)',
    fontFamily      : "'Fira Code','JetBrains Mono','Consolas',monospace",
    fontSize        : '12px',
    lineHeight      : '1.6',
    color           : '#abb2bf',
    zIndex          : '9999',
    boxSizing       : 'border-box',
  })

  // 标题行
  const header = document.createElement('div')
  Object.assign(header.style, { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'8px' })

  const labelEl = document.createElement('span')
  labelEl.textContent = entry.label
  Object.assign(labelEl.style, { fontWeight:'600', fontSize:'13px', color:'#61afef', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' })

  const badgeEl = document.createElement('span')
  badgeEl.textContent = badge.text
  Object.assign(badgeEl.style, { flexShrink:'0', fontSize:'10px', fontWeight:'700', padding:'2px 6px',
    borderRadius:'3px', letterSpacing:'.5px', background:badge.bg, color:badge.fg })

  header.appendChild(labelEl)
  header.appendChild(badgeEl)

  // 分隔线
  const divider = document.createElement('div')
  Object.assign(divider.style, { height:'1px', background:'#3e4451', marginBottom:'8px' })

  // 描述
  const descEl = document.createElement('div')
  descEl.textContent = entry.desc
  Object.assign(descEl.style, { fontSize:'12px', color:'#abb2bf', lineHeight:'1.65', wordBreak:'break-word' })

  root.appendChild(header)
  root.appendChild(divider)
  root.appendChild(descEl)

  // 示例代码块（可选）
  if (entry.extra) {
    const extra = document.createElement('div')
    extra.textContent = entry.extra
    Object.assign(extra.style, { marginTop:'8px', padding:'6px 8px', background:'#0d1117',
      borderRadius:'4px', fontSize:'11px', color:'#98c379', lineHeight:'1.6',
      borderLeft:'2px solid #3e4451', wordBreak:'break-all' })
    root.appendChild(extra)
  }

  return root
}

/**
 * 从文档位置 pos 向两侧扩展，提取当前 token 文本（支持 #前缀和点号属性链）
 */
function getTokenAt(doc: { sliceString(from: number, to: number): string; length: number }, pos: number): { from: number; to: number; text: string } | null {
  const line = doc.sliceString(Math.max(0, pos - 100), Math.min(doc.length, pos + 100))
  const offset = Math.min(pos, 100)

  // 向左扩展：匹配 #、字母、数字、下划线、点
  let start = offset
  while (start > 0) {
    const char = line[start - 1]

    if (!char || !/[#\w.]/.test(char)) {
      break
    }

    start--
  }

  // 向右扩展
  let end = offset
  while (end < line.length) {
    const ch = line[end]

    if (!ch || !/[\w.(]/.test(ch)) {
      break
    }

    end++
  }

  const text = line.slice(start, end).replace(/\(.*$/, '') // 去掉函数调用括号
  if (!text) return null

  return { from: pos - (offset - start), to: pos + (end - offset), text }
}

const spelHoverTooltip = hoverTooltip(
  (view, pos) => {
    const token = getTokenAt(view.state.doc, pos)
    if (!token) return null

    // 在词典中查找匹配项（完全匹配 label）
    const entries = buildEntries()
    const entry = entries.find(e => e.label === token.text)
    if (!entry) return null

    return {
      pos   : token.from,
      end   : token.to,
      above : true,           // 优先在 token 上方显示，空间不足时自动翻转
      create: () => ({ dom: buildHoverTooltipDom(entry) }),
    }
  },
  { hoverTime: 300 },         // 鼠标停留 300ms 后触发
)

// ─── 自动补全源 ───────────────────────────────────────────────────────────
// 补全列表只保留 label / type / detail，不再携带 info 函数（已由 hoverTooltip 接管）
const spelCompletionSource: CompletionSource = (ctx: CompletionContext) => {
  const word = ctx.matchBefore(/[#a-zA-Z_][\w#.]*/)
  if (!word || (word.from === word.to && !ctx.explicit)) return null

  const lower = word.text.toLowerCase()
  const options: Completion[] = buildEntries()
    .filter(e => e.label.toLowerCase().startsWith(lower))
    .map(e => ({
      label : e.label,
      type  : e.type,
      detail: e.detail,
      apply : (view: EditorView) =>
        view.dispatch({ changes: { from: word.from, to: word.to, insert: e.label } }),
    }))

  return { from: word.from, options }
}

// ─── vue-codemirror extensions ────────────────────────────────────────────
const extensions = computed(() => {
  // 每次 computed 重新执行时补全样式已注入（幂等）
  injectAutocompleteStyle()

  return [
    // UI 基础
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),

    // 键映射
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap,
    ]),

    // SpEL 语言 + 高亮
    spelLanguage,
    syntaxHighlighting(spelHighlightStyle),

    // 自动补全（不再需要 info，浮窗由 hoverTooltip 接管）
    autocompletion({
      override        : [spelCompletionSource],
      defaultKeymap   : true,
      closeOnBlur     : false,
      activateOnTyping: true,
    }),

    // ★ hoverTooltip：鼠标悬停 token 显示详情
    spelHoverTooltip,

    // 主题
    spelTheme,

    // 换行
    EditorView.lineWrapping,
  ]
})

// ─── 同步父组件 modelValue → 编辑器 ──────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  if (!cmRef.value?.view) return
  const view = cmRef.value.view as EditorView
  if (view.state.doc.toString() !== newVal)
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newVal } })
})
</script>

<template>
  <div
    class="spel-editor-wrap border border-gray-700 rounded-lg overflow-hidden shadow-lg"
    :style="containerStyle"
  >
    <!-- 标题栏 -->
    <div class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 select-none">
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
        class="flex items-center gap-2 px-4 py-2 text-sm text-red-300 bg-red-950/70 border-t border-red-800"
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
  background    : #1a1a2e;
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

/* 错误提示动画 */
.spel-err-enter-active,
.spel-err-leave-active { transition: all .2s ease; }
.spel-err-enter-from,
.spel-err-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
