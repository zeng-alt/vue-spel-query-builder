import type { ThemeTokens, SpelEntry } from './spel-types'

export function buildHoverTooltipDom(entry: SpelEntry, T: ThemeTokens): HTMLElement {
  const bm: Record<string, { bg: string; fg: string; text: string }> = {
    variable: { bg: T.badgeVarBg, fg: T.badgeVarFg, text: 'VAR' },
    property: { bg: T.badgePropBg, fg: T.badgePropFg, text: 'PROP' },
    keyword:  { bg: T.badgeKeyBg, fg: T.badgeKeyFg, text: 'KEY' },
    function: { bg: T.badgeFnBg, fg: T.badgeFnFg, text: 'FN' },
  }
  const badge = bm[entry.type] ?? { bg: T.acBg, fg: T.acItemFg, text: '' }

  const root = document.createElement('div')
  Object.assign(root.style, {
    padding: '12px 14px', minWidth: '240px', maxWidth: '320px',
    background: T.ttBg, border: `1px solid ${T.ttBorder}`,
    borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
    fontFamily: "'Fira Code','JetBrains Mono','Consolas',monospace",
    fontSize: '12px', lineHeight: '1.6', color: T.ttFg,
  })

  const h = document.createElement('div')
  Object.assign(h.style, { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'8px' })
  const lb = document.createElement('span'); lb.textContent = entry.label
  Object.assign(lb.style, { fontWeight:'600', fontSize:'13px', color: T.ttLabelFg })
  const be = document.createElement('span'); be.textContent = badge.text
  Object.assign(be.style, { flexShrink:'0', fontSize:'10px', fontWeight:'700', padding:'2px 6px', borderRadius:'3px', background: badge.bg, color: badge.fg })
  h.appendChild(lb); h.appendChild(be)

  const dv = document.createElement('div')
  Object.assign(dv.style, { height:'1px', background: T.ttDivider, marginBottom:'8px' })

  const dc = document.createElement('div'); dc.textContent = entry.desc
  Object.assign(dc.style, { fontSize:'12px', color: T.ttFg, lineHeight:'1.65' })

  root.appendChild(h); root.appendChild(dv); root.appendChild(dc)
  if (entry.extra) {
    const ex = document.createElement('div'); ex.textContent = entry.extra
    Object.assign(ex.style, { marginTop:'8px', padding:'6px 8px', background: T.ttCodeBg, borderRadius:'4px', fontSize:'11px', color: T.ttCodeFg, borderLeft: `2px solid ${T.ttCodeBorder}` })
    root.appendChild(ex)
  }
  return root
}