import type { SpelEntry, ArrayMeta, ElementField } from './spel-types'
import type { CustomMethod } from '../../types'

export function buildEntries(
  authentication?: Record<string, any>,
  principal?: Record<string, any>,
  locals?: Record<string, any>,
  methods?: CustomMethod[],
): SpelEntry[] {
  const list: SpelEntry[] = []
  if (authentication) {
    list.push({
      label: 'authentication',
      type: 'variable',
      detail: '用户认证信息',
      desc: '存储当前登录用户的认证信息。',
      extra: 'authentication.name / authentication.roles',
    })
    for (const key of Object.keys(authentication)) {
      list.push({
        label: `authentication.${key}`,
        type: 'property',
        detail: 'authentication 属性',
        desc: `authentication 对象的 ${key} 属性`,
      })
      const val = authentication[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `authentication.${key}.${sub}`,
            type: 'property',
            detail: '嵌套属性',
            desc: `authentication.${key} 的 ${sub} 属性`,
          })
    }
  }
  if (principal) {
    list.push({
      label: 'principal',
      type: 'variable',
      detail: '基础变量信息',
      desc: '业务主体对象。',
      extra: 'principal.id / principal.status',
    })
    for (const key of Object.keys(principal)) {
      list.push({
        label: `principal.${key}`,
        type: 'property',
        detail: 'principal 属性',
        desc: `principal 对象的 ${key} 属性`,
      })
      const val = principal[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `principal.${key}.${sub}`,
            type: 'property',
            detail: '嵌套属性',
            desc: `principal.${key} 的 ${sub} 属性`,
          })
    }
  }
  if (locals) {
    for (const key of Object.keys(locals)) {
      list.push({
        label: `#${key}`,
        type: 'variable',
        detail: 'locals 变量',
        desc: '用户自定义本地变量。',
        extra: `#${key}`,
      })
      const val = locals[key]
      if (val && typeof val === 'object' && !Array.isArray(val))
        for (const sub of Object.keys(val))
          list.push({
            label: `#${key}.${sub}`,
            type: 'property',
            detail: `#${key} 属性`,
            desc: `#${key} 的 ${sub} 属性`,
          })
    }
  }
  ;[
    { label: 'true', detail: '布尔值', desc: '布尔真值。', extra: 'principal.active == true' },
    { label: 'false', detail: '布尔值', desc: '布尔假值。', extra: 'principal.deleted == false' },
    { label: 'null', detail: '空值', desc: '表示空引用。', extra: 'principal.owner != null' },
    { label: 'and', detail: '逻辑与', desc: '逻辑与 &&。', extra: 'a > 0 and b > 0' },
    { label: 'or', detail: '逻辑或', desc: '逻辑或 ||。', extra: 'a == 1 or b == 1' },
    { label: 'not', detail: '逻辑非', desc: '逻辑非 !。', extra: 'not principal.deleted' },
  ].forEach((k) => list.push({ ...k, type: 'keyword' as const }))
  ;[
    {
      label: 'contains',
      detail: '包含判断',
      desc: '字符串或集合包含判断。',
      extra: "principal.name.contains('admin')",
    },
    {
      label: 'startsWith',
      detail: '前缀匹配',
      desc: '字符串前缀匹配。',
      extra: "principal.code.startsWith('ORD')",
    },
    {
      label: 'endsWith',
      detail: '后缀匹配',
      desc: '字符串后缀匹配。',
      extra: "principal.file.endsWith('.pdf')",
    },
    {
      label: 'matches',
      detail: '正则匹配',
      desc: '正则表达式匹配。',
      extra: "principal.phone.matches('1[3-9]\\\\\\\\d{9}')",
    },
    {
      label: 'isEmpty',
      detail: '判断为空',
      desc: '字符串或集合长度是否为 0。',
      extra: 'principal.tags.isEmpty()',
    },
    {
      label: 'size()',
      detail: '集合长度',
      desc: '返回集合的元素数量。',
      extra: 'principal.items.size() > 0',
    },
    {
      label: 'length()',
      detail: '字符串长度',
      desc: '返回字符串的字符数量。',
      extra: 'principal.name.length() > 2',
    },
  ].forEach((f) => list.push({ ...f, type: 'function' as const }))
  if (methods) {
    for (const m of methods) {
      const args = m.params
        ? m.params.map(p => `${p.name}: ${p.type}`).join(', ')
        : Array.from({ length: m.argumentCount }, (_, i) => `arg${i + 1}`).join(', ')
      const retType = m.returnType ? `: ${m.returnType}` : ''
      list.push({
        label: `${m.name}(${args})${retType}`,
        type: 'function' as const,
        detail: `自定义方法${retType}`,
        desc: m.description ?? '',
        extra: `${m.name}(${args})${retType}`,
      })
    }
  }
  return list
}

export function buildTypeMap(
  authentication?: Record<string, any>,
  principal?: Record<string, any>,
  locals?: Record<string, any>,
  _methods?: CustomMethod[],
): Record<string, string> {
  const map: Record<string, string> = {}
  function walk(obj: any, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      const fp = prefix ? `${prefix}.${key}` : key
      const val = obj[key]
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

export function buildElementFields(obj: any): ElementField[] {
  if (!obj || typeof obj !== 'object') return []
  return Object.keys(obj).map((key) => {
    const val = obj[key]
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
  authentication?: Record<string, any>,
  principal?: Record<string, any>,
  locals?: Record<string, any>,
): Record<string, ArrayMeta> {
  const meta: Record<string, ArrayMeta> = {}
  function walkArr(obj: any, prefix: string) {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      const fp = prefix ? `${prefix}.${key}` : key
      const val = obj[key]
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

export function buildStringMethodEntries(): SpelEntry[] {
  return [
    {
      label: 'length',
      type: 'property',
      detail: '字符串长度',
      desc: '返回字符串的字符数量。',
      extra: 'principal.name.length',
    },
    {
      label: 'isEmpty()',
      type: 'function',
      detail: '判断为空',
      desc: '判断长度是否为 0。',
      extra: 'principal.name.isEmpty()',
    },
    {
      label: 'toUpperCase()',
      type: 'function',
      detail: '转大写',
      desc: '将字符串转换为大写。',
      extra: 'principal.name.toUpperCase()',
    },
    {
      label: 'toLowerCase()',
      type: 'function',
      detail: '转小写',
      desc: '将字符串转换为小写。',
      extra: 'principal.name.toLowerCase()',
    },
    {
      label: 'trim()',
      type: 'function',
      detail: '去除空格',
      desc: '去除字符串首尾空白字符。',
      extra: 'principal.name.trim()',
    },
    {
      label: 'substring(x)',
      type: 'function',
      detail: '子串截取(1参)',
      desc: '从指定位置截取。',
      extra: 'principal.name.substring(3)',
    },
    {
      label: 'substring(x,y)',
      type: 'function',
      detail: '子串截取(2参)',
      desc: '从起始截取到结束。',
      extra: 'principal.name.substring(0, 3)',
    },
    {
      label: 'replace(x,y)',
      type: 'function',
      detail: '字符串替换',
      desc: '替换字符。',
      extra: "principal.name.replace('old', 'new')",
    },
    {
      label: 'startsWith(x)',
      type: 'function',
      detail: '前缀匹配',
      desc: '是否以指定前缀开头。',
      extra: "principal.code.startsWith('ORD')",
    },
    {
      label: 'endsWith(x)',
      type: 'function',
      detail: '后缀匹配',
      desc: '是否以指定后缀结尾。',
      extra: "principal.file.endsWith('.pdf')",
    },
    {
      label: 'contains(x)',
      type: 'function',
      detail: '包含判断',
      desc: '是否包含指定子串。',
      extra: "principal.name.contains('value')",
    },
    {
      label: 'indexOf(x)',
      type: 'function',
      detail: '查找索引',
      desc: '返回首次位置。',
      extra: "principal.name.indexOf('a')",
    },
    {
      label: 'charAt(x)',
      type: 'function',
      detail: '获取字符',
      desc: '返回指定位置字符。',
      extra: 'principal.name.charAt(0)',
    },
  ]
}

export function buildArrayMethodEntries(am?: ArrayMeta): SpelEntry[] {
  const r: SpelEntry[] = [
    {
      label: 'size()',
      type: 'function',
      detail: '集合大小',
      desc: '返回数组元素数量。',
      extra: '...roles.size() > 0',
    },
    {
      label: 'contains(x)',
      type: 'function',
      detail: '包含判断',
      desc: '数组是否包含指定元素。',
      extra: "...roles.contains('admin')",
    },
  ]
  if (am?.elementType === 'object' && am.elementFields) {
    r.push({
      label: '?[field == x]',
      type: 'function',
      detail: '过滤-对象数组',
      desc: `可用字段：${am.elementFields.map((f) => f.label).join(', ')}`,
      extra: `...roles.?[${am.elementFields[0]?.label ?? 'field'} == value]`,
    })
    r.push({
      label: '![field]',
      type: 'function',
      detail: '投影-提取字段',
      desc: '从对象数组中提取指定字段。',
      extra: '...roles.![code]',
    })
    for (const f of am.elementFields)
      r.push({
        label: `[0].${f.label}`,
        type: 'property',
        detail: '数组元素字段',
        desc: `元素 ${f.label}，类型 ${f.type}`,
        extra: `...roles[0].${f.label}`,
      })
  } else {
    r.push({
      label: '?[#this == x]',
      type: 'function',
      detail: '过滤-基本类型数组',
      desc: `元素类型: ${am?.elementType ?? 'string'}`,
      extra: "...roles.?[#this == 'value']",
    })
  }
  return r
}

export function buildFilterFieldEntries(fields: ElementField[], prefix = ''): SpelEntry[] {
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
        ? `对象 ${f.label}`
        : f.type === 'array'
          ? `数组 ${f.label}`
          : `字段 ${f.label}`,
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
