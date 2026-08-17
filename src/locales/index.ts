import { ref, computed, provide, inject, type InjectionKey, type Ref } from 'vue'
import {
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
} from 'naive-ui'
import zhMessages from './zh.json'
import enMessages from './en.json'
import type { SpelLocale, SpelMessages } from '../types'

export type { SpelLocale, SpelMessages } from '../types'

export type Messages = Record<string, unknown>

export interface SpelConfigContext {
  locale: Ref<SpelLocale>
  localeFallback: Ref<SpelLocale>
  messages?: Ref<SpelMessages | undefined>
}

export const spelConfigInjectionKey: InjectionKey<SpelConfigContext> = Symbol('spelConfig')

const defaultMessages: Record<string, Messages> = {
  zh: zhMessages,
  en: enMessages,
}

const globalLocale = ref<SpelLocale>('zh')
const globalFallback = ref<SpelLocale>('zh')

export function provideSpelConfig(context: SpelConfigContext): void {
  provide(spelConfigInjectionKey, context)
}

export function useSpelConfig(): SpelConfigContext | null {
  return inject(spelConfigInjectionKey, null)
}

export function setLocale(locale: SpelLocale): void {
  globalLocale.value = locale
}

export function setLocaleFallback(locale: SpelLocale): void {
  globalFallback.value = locale
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const key of Object.keys(override)) {
    const baseVal = base[key]
    const ovVal = override[key]
    result[key] = isPlainObject(baseVal) && isPlainObject(ovVal) ? deepMerge(baseVal, ovVal) : ovVal
  }
  return result
}

/**
 * 扩展/覆盖语言包（深合并，支持任意自定义 locale 名）
 * 例：setLocaleMessages('custom', { ruleTree: { group: { addCondition: 'Add Condition' } } })
 */
export function setLocaleMessages(locale: string, messages: Messages): void {
  defaultMessages[locale] = deepMerge(defaultMessages[locale] ?? {}, messages) as Messages
}

export function getLocale(): SpelLocale {
  return globalLocale.value
}

export function getLocaleFallback(): SpelLocale {
  return globalFallback.value
}

function getValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template
  return template.replace(/\{\s*([\w]+)\s*\}/g, (_, key) => String(values[key] ?? ''))
}

export function t(
  key: string,
  values?: Record<string, string | number>,
  locale?: SpelLocale,
  fallback?: SpelLocale,
  extraMessages?: SpelMessages,
): string {
  const loc = locale ?? globalLocale.value
  const fb = fallback ?? globalFallback.value
  const merged = deepMerge(defaultMessages[loc] ?? {}, (extraMessages?.[loc] ?? {}) as Record<string, unknown>)
  let raw = getValue(merged, key)
  if (raw === undefined && fb !== loc) {
    const mergedFb = deepMerge(defaultMessages[fb] ?? {}, (extraMessages?.[fb] ?? {}) as Record<string, unknown>)
    raw = getValue(mergedFb, key)
  }
  if (typeof raw !== 'string') {
    console.warn(`[vue-spel-query-builder] i18n key not found: ${key}`)
    return key
  }
  return interpolate(raw, values)
}

export function resolveNaiveLocale(locale: SpelLocale) {
  return locale === 'zh' ? naiveZhCN : naiveEnUS
}

export function resolveNaiveDateLocale(locale: SpelLocale) {
  return locale === 'zh' ? naiveDateZhCN : naiveDateEnUS
}

export function useNaiveLocales(locale?: Ref<SpelLocale>) {
  const loc = locale ?? computed(getLocale)
  return {
    naiveLocale: computed(() => resolveNaiveLocale(loc.value)),
    naiveDateLocale: computed(() => resolveNaiveDateLocale(loc.value)),
  }
}