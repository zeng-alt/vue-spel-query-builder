import { StreamLanguage } from '@codemirror/language'

/**
 * SpEL StreamLanguage 解析器
 * 用于语法高亮、括号匹配等
 */

export const SPEL_KEYWORDS = new Set([
  'true', 'false', 'null', 'and', 'or', 'not',
  'instanceof', 'matches', 'new', 'div', 'mod',
])

export const SPEL_BUILTIN_FNS = new Set([
  'contains', 'startsWith', 'endsWith', 'isEmpty',
  'size', 'length', 'substring', 'toUpperCase',
  'toLowerCase', 'trim',
])

export const spelLanguage = StreamLanguage.define({
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
        if (esc) { esc = false; continue }
        if (c === '\\') { esc = true; continue }
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
      if (SPEL_KEYWORDS.has(word)) return 'keyword'
      if (SPEL_BUILTIN_FNS.has(word)) return 'def'
      if (stream.match(/^\s*\(/, false)) return 'def'
      return 'variable'
    }

    // .属性名
    if (ch === '.') {
      stream.next()
      if (stream.match(/^[a-zA-Z_]\w*/)) return 'property'
      return 'operator'
    }

    // 运算符
    if (ch && /[=!<>&|+\-*/%^~?:]/.test(ch)) {
      stream.match(/^(===|!==|==|!=|<=|>=|&&|\|\||[=!<>&|+\-*/%^~?:])/)
      return 'operator'
    }

    stream.next()
    return null
  },
})
