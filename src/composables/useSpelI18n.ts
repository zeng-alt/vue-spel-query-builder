import { computed } from 'vue'
import {
  t as globalT,
  useSpelConfig,
  getLocale,
  getLocaleFallback,
  resolveNaiveLocale,
  resolveNaiveDateLocale,
  type SpelLocale,
} from '../locales'

export interface UseSpelI18nOptions {
  locale?: SpelLocale
  localeFallback?: SpelLocale
}

export function useSpelI18n(options?: UseSpelI18nOptions) {
  const config = useSpelConfig()

  const locale = computed<SpelLocale>(
    () => options?.locale ?? config?.locale.value ?? getLocale(),
  )
  const fallback = computed<SpelLocale>(
    () => options?.localeFallback ?? config?.localeFallback.value ?? getLocaleFallback(),
  )

  function t(key: string, values?: Record<string, string | number>): string {
    return globalT(key, values, locale.value, fallback.value)
  }

  return {
    t,
    locale,
    fallback,
    naiveLocale: computed(() => resolveNaiveLocale(locale.value)),
    naiveDateLocale: computed(() => resolveNaiveDateLocale(locale.value)),
  }
}
