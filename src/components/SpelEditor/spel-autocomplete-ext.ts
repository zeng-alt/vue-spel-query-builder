import {
  hoverTooltip, keymap,
  lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, rectangularSelection,
  crosshairCursor, highlightActiveLine, EditorView,
} from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  foldGutter, indentOnInput, syntaxHighlighting, bracketMatching,
} from '@codemirror/language'
import {
  closeBrackets, closeBracketsKeymap,
  autocompletion, completionKeymap,
  type CompletionSource,
} from '@codemirror/autocomplete'

import { spelLanguage } from './spel-parser'
import { createSpelHighlightStyle, createSpelTheme } from './spel-theme'
import type { ThemeTokens, SpelEntry } from './spel-types'

export { buildHoverTooltipDom } from './spel-autocomplete-tooltip'

export function buildExtensions(
  T: ThemeTokens,
  isDark: boolean,
  fontSize: number,
  source: CompletionSource,
  tooltip: ReturnType<typeof hoverTooltip>,
) {
  return [
    lineNumbers(), highlightActiveLineGutter(), highlightSpecialChars(),
    history(), foldGutter(), drawSelection(), dropCursor(),
    EditorState.allowMultipleSelections.of(true), indentOnInput(),
    bracketMatching(), closeBrackets(), rectangularSelection(),
    crosshairCursor(), highlightActiveLine(),
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
    spelLanguage,
    syntaxHighlighting(createSpelHighlightStyle(T)),
    autocompletion({ override: [source], defaultKeymap: true, closeOnBlur: false, activateOnTyping: true }),
    tooltip,
    createSpelTheme(T, isDark, fontSize),
    EditorView.lineWrapping,
  ]
}