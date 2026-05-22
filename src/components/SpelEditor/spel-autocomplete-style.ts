import type { ThemeTokens } from './spel-types'

const ID = 'spel-autocomplete-style'

export function injectAutocompleteStyle(T: ThemeTokens) {
  let el = document.getElementById(ID) as HTMLStyleElement | null
  if (!el) { el = document.createElement('style'); el.id = ID; document.head.appendChild(el) }
  el.textContent = [
    `.cm-tooltip-autocomplete { background:${T.acBg}!important; border:1px solid ${T.acBorder}!important; border-radius:8px!important; }`,
    `.cm-tooltip-autocomplete .cm-completionItem { display:flex!important; gap:8px!important; padding:7px 10px!important; cursor:pointer!important; color:${T.acItemFg}!important; }`,
    `.cm-tooltip-autocomplete .cm-completionItem:hover { background:${T.acItemHoverBg}!important; }`,
    `.cm-completionIcon.cm-variable { background:${T.acIconVarBg}; color:${T.acIconVar}; }`,
    `.cm-completionIcon.cm-property { background:${T.acIconPropBg}; color:${T.acIconProp}; }`,
    `.cm-completionLabel { font-family:'Fira Code',monospace!important; font-size:13px!important; color:${T.acLabel}!important; }`,
    `.cm-completionDetail { margin-left:auto!important; font-size:11px!important; color:${T.acDetail}!important; border-left:1px solid ${T.acDetailBorder}!important; }`,
  ].join('\n')
}

export function getTokenAt(doc: { sliceString: (a: number, b: number) => string; length: number }, pos: number) {
  const line = doc.sliceString(Math.max(0, pos - 100), Math.min(doc.length, pos + 100))
  const off = Math.min(pos, 100)
  let s = off; while (s > 0) { const c = line[s - 1]; if (!c || !/[#\w.]/.test(c)) break; s-- }
  let e = off; while (e < line.length) { const c = line[e]; if (!c || !/[\w.(]/.test(c)) break; e++ }
  const text = line.slice(s, e).replace(/\(.*$/, '')
  if (!text) return null
  return { from: pos - (off - s), to: pos + (e - off), text }
}
