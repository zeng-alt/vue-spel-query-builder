import { ref, computed, provide, inject, type InjectionKey, type Ref } from 'vue'
import {
  zhCN as naiveZhCN,
  enUS as naiveEnUS,
  dateZhCN as naiveDateZhCN,
  dateEnUS as naiveDateEnUS,
} from 'naive-ui'
import zhMessages from './zh.json'
import enMessages from './en.json'

export type SpelLocale = 'zh' | 'en'

export interface SpelConfigContext {
  locale: Ref<SpelLocale>
  localeFallback: Ref<SpelLocale>
}

export const spelConfigInjectionKey: InjectionKey<SpelConfigContext> = Symbol('spelConfig')

interface Messages {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const defaultMessages: Record<SpelLocale, Messages> = {
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

export function setLocaleMessages(locale: SpelLocale, messages: Messages): void {
  defaultMessages[locale] = { ...defaultMessages[locale], ...messages }
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
): string {
  const loc = locale ?? globalLocale.value
  const fb = fallback ?? globalFallback.value
  let raw = getValue(defaultMessages[loc], key)
  if (raw === undefined && fb !== loc) raw = getValue(defaultMessages[fb], key)
  if (typeof raw !== 'string') {
     
    console.warn(`[vue-spel-query-builder] i18n key not found: ${key}`)
    return key
  }
  return interpolate(raw, values)
}

export function resolveNaiveLocale(locale: SpelLocale) {
  return locale === 'en' ? naiveEnUS : naiveZhCN
}

export function resolveNaiveDateLocale(locale: SpelLocale) {
  return locale === 'en' ? naiveDateEnUS : naiveDateZhCN
}

export function useNaiveLocales(locale?: Ref<SpelLocale>) {
  const loc = locale ?? computed(getLocale)
  return {
    naiveLocale: computed(() => resolveNaiveLocale(loc.value)),
    naiveDateLocale: computed(() => resolveNaiveDateLocale(loc.value)),
  }
}
