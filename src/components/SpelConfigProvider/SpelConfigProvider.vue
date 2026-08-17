<script setup lang="ts">
import { computed } from 'vue'
import { provideSpelConfig, type SpelLocale } from '../../locales'
import type { SpelMessages } from '../../types'

const props = withDefaults(defineProps<{
  locale?: SpelLocale
  localeFallback?: SpelLocale
  messages?: SpelMessages
}>(), {
  locale: 'zh',
  localeFallback: 'zh',
})

provideSpelConfig({
  locale: computed(() => props.locale),
  localeFallback: computed(() => props.localeFallback),
  messages: computed(() => props.messages),
})
</script>

<template>
  <slot />
</template>
