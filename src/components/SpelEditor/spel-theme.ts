import {
  HighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { ThemeTokens } from './spel-types'

/**
 * 编辑器主题色板
 */
export const DARK: ThemeTokens = {
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

export const LIGHT: ThemeTokens = {
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

/**
 * 创建语法高亮样式（随主题响应式重建）
 */
export function createSpelHighlightStyle(T: ThemeTokens) {
  return HighlightStyle.define([
    { tag: tags.keyword,                       color: T.keyword   },
    { tag: tags.operator,                      color: T.operator  },
    { tag: tags.string,                        color: T.string    },
    { tag: tags.number,                        color: T.number    },
    { tag: tags.bool,                          color: T.atom      },
    { tag: tags.null,                          color: T.atom      },
    { tag: tags.atom,                          color: T.atom      },
    { tag: tags.variableName,                  color: T.variable  },
    { tag: tags.special(tags.variableName),    color: T.variable  },
    { tag: tags.definition(tags.variableName), color: T.definition},
    { tag: tags.propertyName,                  color: T.property  },
    { tag: tags.comment,                       color: T.comment, fontStyle: 'italic' },
  ])
}

/**
 * 创建编辑器 UI 主题（随主题响应式重建）
 */
export function createSpelTheme(T: ThemeTokens, isDark: boolean, fontSize: number) {
  return EditorView.theme({
    '&'                        : { height: '100%', backgroundColor: T.editorBg },
    '.cm-scroller'             : { overflow: 'auto', backgroundColor: T.editorBg,
                                    fontFamily: "'Fira Code','JetBrains Mono','Monaco','Consolas',monospace",
                                    fontSize: `${fontSize}px` },
    '.cm-content'              : { caretColor: T.cursor, color: T.contentFg, padding: '12px' },
    '.cm-line'                 : { color: T.contentFg, padding: '2px 0' },
    '.cm-cursor'               : { borderLeftColor: T.cursor, borderLeftWidth: '2px' },
    '.cm-selectionBackground'  : { backgroundColor: `${T.selectionBg} !important` },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: `${T.selectionBg} !important` },
    '.cm-activeLine'           : { backgroundColor: T.activeLine },
    '.cm-gutters'              : { backgroundColor: T.gutterBg,
                                    borderRight: `1px solid ${T.gutterBorder}`, minWidth: '48px' },
    '.cm-lineNumbers .cm-gutterElement': { color: T.gutterFg, padding: '0 12px', fontSize: '12px' },
    '.cm-activeLineGutter'     : { backgroundColor: T.activeGutter },
    '.cm-matchingBracket'      : { color: `${T.matchBracket} !important`,
                                    backgroundColor: T.matchBracketBg, fontWeight: 'bold' },
  }, { dark: isDark })
}
