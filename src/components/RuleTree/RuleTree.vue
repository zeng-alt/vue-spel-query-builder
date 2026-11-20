<script setup lang="ts">
import { computed } from 'vue'
import { useRuleTree } from '../../composables'
import type { RuleTreeProps, RuleTreeEmits, RuleTreeInstance } from '../../types'
import RuleTreeNode from './RuleTreeNode.vue'
import { NConfigProvider } from 'naive-ui'
import { darkTheme, lightTheme } from 'naive-ui'
import { provideSpelConfig, useNaiveLocales } from '../../locales'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<RuleTreeProps>(), {
  theme: 'light',
  size: 'small',
  locale: 'zh',
  localeFallback: 'zh',
})

provideSpelConfig({
  locale: computed(() => props.locale),
  localeFallback: computed(() => props.localeFallback),
  messages: computed(() => props.messages),
})

const { naiveLocale, naiveDateLocale } = useNaiveLocales(computed(() => props.locale))
const emit = defineEmits<RuleTreeEmits>()

const { getSpelExpression, setSpelExpression, addCondition, addGroup, removeNode, updateNode, validate } = useRuleTree(
  props,
  emit as (event: string, ...args: unknown[]) => void,
)

defineExpose<RuleTreeInstance>({
  getSpelExpression,
  setSpelExpression,
  validate,
})

const currentTheme = computed(() => props.theme === 'dark' ? darkTheme : lightTheme)

// 容器内边距（替代原 .rule-tree-container.size--* 规则）
const sizePad = computed(() => ({ tiny: 'p-2', small: 'p-3', medium: 'p-5', large: 'p-7' })[props.size])
</script>

<template>
  <div class="spel-query-builder" style="display: contents">
  <NConfigProvider v-bind="$attrs" :theme="currentTheme" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <div class="rule-tree-container rounded-[8px] min-h-[200px] transition-colors duration-200" :class="[`theme--${props.theme}`, sizePad]">
      <RuleTreeNode
        :node="modelValue"
        :authentication="authentication"
        :principal="principal"
        :locals="locals"
        :globals="globals"
        :methods="methods"
        :disabled="disabled"
        :level="0"
        :theme="props.theme"
        :size="props.size"
        @add-condition="addCondition"
        @add-group="addGroup"
        @remove-node="removeNode"
        @update-node="updateNode"
      />
    </div>
  </NConfigProvider>
  </div>
</template>

<style scoped>
/* ===================================================================
   CSS Custom Properties — Light & Dark themes
   Defined at the root container so all descendants inherit the correct values.
   =================================================================== */
.rule-tree-container.theme--light {
  background: #f8fafc;

  --card-bg: #ffffff;
  --card-border-idle: #e5e7eb;
  --card-border-hover: #d1d5db;
  --card-border-editing: #60a5fa;
  --card-shadow-editing: 0 1px 3px rgba(0,0,0,.08);

  --edit-panel-bg: rgba(249, 250, 251, 0.8);
  --edit-panel-border: #f3f4f6;

  --preview-bg: #ffffff;
  --preview-border: #f3f4f6;
  --preview-text: #6b7280;
  --preview-left: #2563eb;
  --preview-op: #4b5563;
  --preview-right: #065f46;

  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-placeholder: #9ca3af;
  --text-muted: #d1d5db;
  --icon-muted: #9ca3af;

  --expr-field-bg: #eff6ff;
  --expr-field-fg: #1d4ed8;
  --expr-field-border: #bfdbfe;

  --expr-op-bg: #f3f4f6;
  --expr-op-fg: #1f2937;
  --expr-op-border: #d1d5db;

  --expr-val-bg: #ecfdf5;
  --expr-val-fg: #065f46;
  --expr-val-border: #a7f3d0;

  --expr-block-body-bg: #ffffff;
  --expr-block-body-border: #e5e7eb;
  --expr-block-label: #9ca3af;

  --op-toggle-border: #d1d5db;
  --op-toggle-shadow: 0 1px 2px rgba(0,0,0,.04);
  --op-toggle-btn-bg: #ffffff;
  --op-toggle-btn-fg: #6b7280;
  --op-toggle-btn-border: #e5e7eb;
  --op-toggle-btn-hover-bg: #f9fafb;
  --op-toggle-btn-hover-fg: #374151;
  --op-toggle-and-bg: #18a058;
  --op-toggle-or-bg: #d97706;
  --op-toggle-not-bg: #dc2626;
  --op-toggle-active-fg: #ffffff;

  --connector-color: #e5e7eb;

  --empty-border: #e5e7eb;
  --empty-fg: #9ca3af;

  --divider-bg: #e5e7eb;
}

.rule-tree-container.theme--dark {
  background: #1a1a2e;

  --card-bg: #1e1e32;
  --card-border-idle: #3e3e5c;
  --card-border-hover: #5c5c7a;
  --card-border-editing: #60a5fa;
  --card-shadow-editing: 0 1px 6px rgba(96, 165, 250, 0.15);

  --edit-panel-bg: rgba(30, 30, 50, 0.85);
  --edit-panel-border: #3e3e5c;

  --preview-bg: #252545;
  --preview-border: #3e3e5c;
  --preview-text: #9ca3af;
  --preview-left: #93c5fd;
  --preview-op: #d1d5db;
  --preview-right: #6ee7b7;

  --text-primary: #e5e5e5;
  --text-secondary: #9ca3af;
  --text-placeholder: #6b7280;
  --text-muted: #4b5563;
  --icon-muted: #6b7280;

  --expr-field-bg: rgba(59, 130, 246, 0.15);
  --expr-field-fg: #93c5fd;
  --expr-field-border: rgba(59, 130, 246, 0.3);

  --expr-op-bg: rgba(107, 114, 128, 0.2);
  --expr-op-fg: #d1d5db;
  --expr-op-border: rgba(107, 114, 128, 0.3);

  --expr-val-bg: rgba(16, 185, 129, 0.15);
  --expr-val-fg: #6ee7b7;
  --expr-val-border: rgba(16, 185, 129, 0.3);

  --expr-block-body-bg: #252545;
  --expr-block-body-border: #3e3e5c;
  --expr-block-label: #6b7280;

  --op-toggle-border: #3e3e5c;
  --op-toggle-shadow: 0 1px 2px rgba(0,0,0,.2);
  --op-toggle-btn-bg: #252545;
  --op-toggle-btn-fg: #9ca3af;
  --op-toggle-btn-border: #3e3e5c;
  --op-toggle-btn-hover-bg: #2e2e52;
  --op-toggle-btn-hover-fg: #e5e5e5;
  --op-toggle-and-bg: #63e2b7;
  --op-toggle-or-bg: #d97706;
  --op-toggle-not-bg: #dc2626;
  --op-toggle-active-fg: #ffffff;

  --connector-color: #3e3e5c;

  --empty-border: #3e3e5c;
  --empty-fg: #6b7280;

  --divider-bg: #3e3e5c;
}
</style>
