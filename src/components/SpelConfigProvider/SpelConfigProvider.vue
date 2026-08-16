<script setup lang="ts">
import { computed } from 'vue'
import { provideSpelConfig, type SpelLocale } from '../../locales'

const props = withDefaults(defineProps<{
  locale?: SpelLocale
  localeFallback?: SpelLocale
}>(), {
  locale: 'zh',
  localeFallback: 'zh',
})

provideSpelConfig({
  locale: computed(() => props.locale),
  localeFallback: computed(() => props.localeFallback),
})
</script>

<template>
  <slot />
</template>
