import type { SpelEntry, ArrayMeta, ElementField } from './spel-types'
import type { CustomMethod } from '../../types'

export type TranslateFn = (key: string, values?: Record<string, string | number>) => string

export function buildEntries(
  authentication?: Record<string, unknown>,
  principal?: Record<string, unknown>,
  locals?: Record<string, unknown>,
  methods?: CustomMethod[],
  t: TranslateFn = (key) => key,
  globals?: Record<string, unknown>,
): SpelEntry[] {
  const list: SpelEntry[] = []
  if (authentication) {
    list.push({
      label: 'authentication',
      type: 'variable',
      detail: t('completions.authentication'),
      desc: t('completions.authenticationDesc'),
      extra: 'authentication.name / authentication.roles',
    })
    for (const key of Object.keys(authentication)) {
      list.push({
        label: `authentication.${key}`,
        type: 'property',
        detail: t('completions.authenticationProperty'),
        desc: `${t('completions.authenticationProperty')} ${key}`,
      })
      const val = authentication[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `authentication.${key}.${sub}`,
            type: 'property',
            detail: t('completions.nestedProperty'),
            desc: `authentication.${key} ${t('completions.nestedProperty')} ${sub}`,
          })
    }
  }
  if (principal) {
    list.push({
      label: 'principal',
      type: 'variable',
      detail: t('completions.principal'),
      desc: t('completions.principalDesc'),
      extra: 'principal.id / principal.status',
    })
    for (const key of Object.keys(principal)) {
      list.push({
        label: `principal.${key}`,
        type: 'property',
        detail: t('completions.principalProperty'),
        desc: `${t('completions.principalProperty')} ${key}`,
      })
      const val = principal[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `principal.${key}.${sub}`,
            type: 'property',
            detail: t('completions.nestedProperty'),
            desc: `principal.${key} ${t('completions.nestedProperty')} ${sub}`,
          })
    }
  }
  if (locals) {
    for (const key of Object.keys(locals)) {
      list.push({
        label: `#${key}`,
        type: 'variable',
        detail: t('completions.localsVariable'),
        desc: t('completions.localsDesc'),
        extra: `#${key}`,
      })
      const val = locals[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `#${key}.${sub}`,
            type: 'property',
            detail: `${t('completions.localsVariable')} ${key}`,
            desc: `#${key} ${t('completions.nestedProperty')} ${sub}`,
          })
    }
  }
  ;[
    { label: 'true', detail: t('completions.booleanValue'), desc: t('completions.trueDesc'), extra: 'principal.active == true' },
    { label: 'false', detail: t('completions.booleanValue'), desc: t('completions.falseDesc'), extra: 'principal.deleted == false' },
    { label: 'null', detail: t('completions.null'), desc: t('completions.nullDesc'), extra: 'principal.owner != null' },
    { label: 'and', detail: t('completions.logicalAnd'), desc: t('completions.andDesc'), extra: 'a > 0 and b > 0' },
    { label: 'or', detail: t('completions.logicalOr'), desc: t('completions.orDesc'), extra: 'a == 1 or b == 1' },
    { label: 'not', detail: t('completions.logicalNot'), desc: t('completions.notDesc'), extra: 'not principal.deleted' },
  ].forEach((k) => list.push({ ...k, type: 'keyword' as const }))
  ;[
    {
      label: 'contains',
      detail: t('completions.containsMethod'),
      desc: t('completions.containsDesc'),
      extra: "principal.name.contains('admin')",
    },
    {
      label: 'startsWith',
      detail: t('completions.startsWithMethod'),
      desc: t('completions.startsWithDesc'),
      extra: "principal.code.startsWith('ORD')",
    },
    {
      label: 'endsWith',
      detail: t('completions.endsWithMethod'),
      desc: t('completions.endsWithDesc'),
      extra: "principal.file.endsWith('.pdf')",
    },
    {
      label: 'matches',
      detail: t('completions.matches'),
      desc: t('completions.matchesDesc'),
      extra: "principal.phone.matches('1[3-9]\\\\\\\\d{9}')",
    },
    {
      label: 'isEmpty',
      detail: t('completions.isEmpty'),
      desc: t('completions.isEmptyDesc'),
      extra: 'principal.tags.isEmpty()',
    },
    {
      label: 'size()',
      detail: t('completions.size'),
      desc: t('completions.sizeDesc'),
      extra: 'principal.items.size() > 0',
    },
    {
      label: 'length()',
      detail: t('completions.length'),
      desc: t('completions.lengthDesc'),
      extra: 'principal.name.length() > 2',
    },
  ].forEach((f) => list.push({ ...f, type: 'function' as const }))
  if (methods) {
    for (const m of methods) {
      const args = Array.from({ length: m.argumentCount }, (_, i) => `arg${i + 1}`).join(', ')
      list.push({
        label: m.name,
        type: 'function' as const,
        detail: t('completions.customMethod'),
        desc: m.description ?? '',
        extra: `${m.name}(${args})`,
        insert: `${m.name}(`,
      })
    }
  }
  function appendGlobals(object: Record<string, unknown>, prefix = '') {
    for (const [name, value] of Object.entries(object)) {
      const path = prefix ? `${prefix}.${name}` : name
      list.push({ label: path, type: 'property', detail: t('completions.globalField'), desc: path })
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        appendGlobals(value as Record<string, unknown>, path)
      }
    }
  }
  if (globals) appendGlobals(globals)
  return list
}

export function buildTypeMap(
  authentication?: Record<string, unknown>,
  principal?: Record<string, unknown>,
  locals?: Record<string, unknown>,
  globals?: Record<string, unknown>,
): Record<string, string> {
  const map: Record<string, string> = {}
  function walk(obj: unknown, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    const record = obj as Record<string, unknown>
    for (const key of Object.keys(record)) {
      const fp = prefix ? `${prefix}.${key}` : key
      const val = record[key]
      if (val === null || val === undefined) map[fp] = 'null'
      else if (Array.isArray(val)) map[fp] = 'array'
      else if (typeof val === 'object') {
        map[fp] = 'object'
        walk(val, fp)
      } else map[fp] = typeof val
    }
  }
  if (authentication) walk(authentication, 'authentication')
  if (principal) walk(principal, 'principal')
  if (globals) walk(globals, '')
  if (locals) {
    for (const key of Object.keys(locals)) {
      const fp = `#${key}`
      const val = locals[key]
      if (val === null || val === undefined) map[fp] = 'null'
      else if (Array.isArray(val)) map[fp] = 'array'
      else if (typeof val === 'object') {
        map[fp] = 'object'
        walk(val, fp)
      } else map[fp] = typeof val
    }
  }
  return map
}

export function buildElementFields(obj: unknown): ElementField[] {
  if (!obj || typeof obj !== 'object') return []
  const record = obj as Record<string, unknown>
  return Object.keys(record).map((key) => {
    const val = record[key]
    const f: ElementField = { label: key, value: key, type: 'null' }
    if (val === null || val === undefined) f.type = 'null'
    else if (Array.isArray(val)) {
      f.type = 'array'
      if (val.length > 0) {
        f.elementType = typeof val[0]
        if (typeof val[0] === 'object' && val[0] !== null)
          f.elementFields = buildElementFields(val[0])
      } else f.elementType = 'string'
    } else if (typeof val === 'object') {
      f.type = 'object'
      f.children = buildElementFields(val)
    } else f.type = typeof val
    return f
  })
}

export function buildArrayMeta(
  authentication?: Record<string, unknown>,
  principal?: Record<string, unknown>,
  locals?: Record<string, unknown>,
  globals?: Record<string, unknown>,
): Record<string, ArrayMeta> {
  const meta: Record<string, ArrayMeta> = {}
  function walkArr(obj: unknown, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    const record = obj as Record<string, unknown>
    for (const key of Object.keys(record)) {
      const fp = prefix ? `${prefix}.${key}` : key
      const val = record[key]
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null)
          meta[fp] = { elementType: 'object', elementFields: buildElementFields(val[0]) }
        else if (val.length > 0) meta[fp] = { elementType: typeof val[0] }
        else meta[fp] = { elementType: 'string' }
      } else if (typeof val === 'object' && val !== null) walkArr(val, fp)
    }
  }
  if (authentication) walkArr(authentication, 'authentication')
  if (principal) walkArr(principal, 'principal')
  if (globals) walkArr(globals, '')
  if (locals) {
    for (const key of Object.keys(locals)) {
      const fp = `#${key}`
      const val = locals[key]
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null)
          meta[fp] = { elementType: 'object', elementFields: buildElementFields(val[0]) }
        else if (val.length > 0) meta[fp] = { elementType: typeof val[0] }
        else meta[fp] = { elementType: 'string' }
      } else if (typeof val === 'object' && val !== null) walkArr(val, fp)
    }
  }
  return meta
}

export function buildStringMethodEntries(t: TranslateFn = (key) => key): SpelEntry[] {
  return [
    {
      label: 'length',
      type: 'property',
      detail: t('completions.length'),
      desc: t('completions.lengthDesc'),
      extra: 'principal.name.length',
    },
    {
      label: 'isEmpty()',
      type: 'function',
      detail: t('completions.isEmpty'),
      desc: t('completions.isEmptyDesc'),
      extra: 'principal.name.isEmpty()',
    },
    {
      label: 'toUpperCase()',
      type: 'function',
      detail: t('completions.toUpperCase'),
      desc: t('completions.toUpperCaseDesc'),
      extra: 'principal.name.toUpperCase()',
    },
    {
      label: 'toLowerCase()',
      type: 'function',
      detail: t('completions.toLowerCase'),
      desc: t('completions.toLowerCaseDesc'),
      extra: 'principal.name.toLowerCase()',
    },
    {
      label: 'trim()',
      type: 'function',
      detail: t('completions.trim'),
      desc: t('completions.trimDesc'),
      extra: 'principal.name.trim()',
    },
    {
      label: 'substring(x)',
      type: 'function',
      detail: t('completions.substring1'),
      desc: t('completions.substring1Desc'),
      extra: 'principal.name.substring(3)',
    },
    {
      label: 'substring(x,y)',
      type: 'function',
      detail: t('completions.substring2'),
      desc: t('completions.substring2Desc'),
      extra: 'principal.name.substring(0, 3)',
    },
    {
      label: 'replace(x,y)',
      type: 'function',
      detail: t('completions.replace'),
      desc: t('completions.replaceDesc'),
      extra: "principal.name.replace('old', 'new')",
    },
    {
      label: 'startsWith(x)',
      type: 'function',
      detail: t('completions.startsWithMethod'),
      desc: t('completions.startsWithDesc'),
      extra: "principal.code.startsWith('ORD')",
    },
    {
      label: 'endsWith(x)',
      type: 'function',
      detail: t('completions.endsWithMethod'),
      desc: t('completions.endsWithDesc'),
      extra: "principal.file.endsWith('.pdf')",
    },
    {
      label: 'contains(x)',
      type: 'function',
      detail: t('completions.containsMethod'),
      desc: t('completions.containsDesc'),
      extra: "principal.name.contains('value')",
    },
    {
      label: 'indexOf(x)',
      type: 'function',
      detail: t('completions.indexOf'),
      desc: t('completions.indexOfDesc'),
      extra: "principal.name.indexOf('a')",
    },
    {
      label: 'charAt(x)',
      type: 'function',
      detail: t('completions.charAt'),
      desc: t('completions.charAtDesc'),
      extra: 'principal.name.charAt(0)',
    },
  ]
}

export function buildArrayMethodEntries(am?: ArrayMeta, t: TranslateFn = (key) => key): SpelEntry[] {
  const r: SpelEntry[] = [
    {
      label: 'size()',
      type: 'function',
      detail: t('completions.arraySize'),
      desc: t('completions.arraySizeDesc'),
      extra: '...roles.size() > 0',
    },
    {
      label: 'contains(x)',
      type: 'function',
      detail: t('completions.arrayContains'),
      desc: t('completions.arrayContainsDesc'),
      extra: "...roles.contains('admin')",
    },
  ]
  if (am?.elementType === 'object' && am.elementFields) {
    r.push({
      label: '?[field == x]',
      type: 'function',
      detail: t('completions.filterObjectArray'),
      desc: t('completions.filterObjectArrayDesc', { fields: am.elementFields.map((f) => f.label).join(', ') }),
      extra: `...roles.?[${am.elementFields[0]?.label ?? 'field'} == value]`,
    })
    r.push({
      label: '![field]',
      type: 'function',
      detail: t('completions.projectField'),
      desc: t('completions.projectFieldDesc'),
      extra: '...roles.![code]',
    })
    for (const f of am.elementFields)
      r.push({
        label: `[0].${f.label}`,
        type: 'property',
        detail: t('completions.arrayElementField'),
        desc: t('completions.arrayElementFieldDesc', { label: f.label, type: f.type }),
        extra: `...roles[0].${f.label}`,
      })
  } else {
    r.push({
      label: '?[#this == x]',
      type: 'function',
      detail: t('completions.filterBaseArray'),
      desc: t('completions.filterBaseArrayDesc', { type: am?.elementType ?? 'string' }),
      extra: "...roles.?[#this == 'value']",
    })
  }
  return r
}

export function buildFilterFieldEntries(fields: ElementField[], prefix = '', t: TranslateFn = (key) => key): SpelEntry[] {
  return fields.map((f) => ({
    label: f.label,
    type: 'property' as const,
    detail:
      f.type === 'array'
        ? `array<${f.elementType ?? '?'}>`
        : f.type === 'object'
          ? 'object'
          : f.type,
    desc:
      f.type === 'object'
        ? t('completions.objectDesc', { label: f.label })
        : f.type === 'array'
          ? t('completions.arrayDesc', { label: f.label })
          : t('completions.fieldDesc', { label: f.label }),
    extra: `...?[${prefix ? `${prefix}.` : ''}${f.label} ...]`,
  }))
}

export function resolveFieldPath(fields: ElementField[], path: string): ElementField | null {
  const parts = path.split('.')
  let cur: ElementField | null = null
  let pool = fields
  for (const part of parts) {
    cur = pool.find((f) => f.label === part) ?? null
    if (!cur) return null
    if (cur.type === 'object' && cur.children) pool = cur.children
    else if (cur.type === 'array' && cur.elementFields) pool = cur.elementFields
    else if (cur.type === 'array') return cur
  }
  return cur
}
