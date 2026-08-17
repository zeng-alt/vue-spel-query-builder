import { computed } from 'vue'
import {
  t as globalT,
  useSpelConfig,
  getLocale,
  getLocaleFallback,
  resolveNaiveLocale,
  resolveNaiveDateLocale,
  type SpelLocale,
  type SpelMessages,
} from '../locales'

export interface UseSpelI18nOptions {
  locale?: SpelLocale
  localeFallback?: SpelLocale
  messages?: SpelMessages
}

export function useSpelI18n(options?: UseSpelI18nOptions) {
  const config = useSpelConfig()

  const locale = computed<SpelLocale>(
    () => options?.locale ?? config?.locale.value ?? getLocale(),
  )
  const fallback = computed<SpelLocale>(
    () => options?.localeFallback ?? config?.localeFallback.value ?? getLocaleFallback(),
  )
  const messages = computed<SpelMessages | undefined>(
    () => options?.messages ?? config?.messages?.value,
  )

  function t(key: string, values?: Record<string, string | number>): string {
    return globalT(key, values, locale.value, fallback.value, messages.value)
  }

  return {
    t,
    locale,
    fallback,
    messages,
    naiveLocale: computed(() => resolveNaiveLocale(locale.value)),
    naiveDateLocale: computed(() => resolveNaiveDateLocale(locale.value)),
  }
}