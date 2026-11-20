export function getTokenAt(doc: { sliceString: (a: number, b: number) => string; length: number }, pos: number) {
  const line = doc.sliceString(Math.max(0, pos - 100), Math.min(doc.length, pos + 100))
  const off = Math.min(pos, 100)
  let s = off; while (s > 0) { const c = line[s - 1]; if (!c || !/[#\w.]/.test(c)) break; s-- }
  let e = off; while (e < line.length) { const c = line[e]; if (!c || !/[\w.(]/.test(c)) break; e++ }
  const text = line.slice(s, e).replace(/\(.*$/, '')
  if (!text) return null
  return { from: pos - (off - s), to: pos + (e - off), text }
}
