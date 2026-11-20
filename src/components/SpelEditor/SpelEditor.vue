<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Annotation, EditorState, StateEffect } from '@codemirror/state'
import { EditorView, hoverTooltip, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { useSpelEditor, useSpelI18n } from '../../composables'
import type { SpelEditorProps, SpelEditorEmits, SpelEditorInstance, ComponentSize } from '../../types'
import { DARK, LIGHT } from './spel-theme'
import { buildEntries, buildTypeMap, buildArrayMeta, buildStringMethodEntries, buildArrayMethodEntries, buildFilterFieldEntries, resolveFieldPath } from './spel-completions'
import { getTokenAt } from './spel-autocomplete-style'
import { buildExtensions, buildHoverTooltipDom } from './spel-autocomplete-ext'
import type { SpelEntry, ThemeTokens, ElementField } from './spel-types'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SpelEditorProps>(), { theme: 'dark', size: 'small', locale: 'zh', localeFallback: 'zh' })
const emit = defineEmits<SpelEditorEmits>()
const { t } = useSpelI18n(props)
const { internalValue, validation, handleInput, handleValidate, setValue, getValue, run } = useSpelEditor(
  props,
  emit as (event: string, ...args: unknown[]) => void,
)

const cmRef = ref<HTMLDivElement>()
let view: EditorView | null = null

const externalChange = Annotation.define<boolean>()

const isDark = computed(() => (props.theme ?? 'dark') === 'dark')
const T = computed<ThemeTokens>(() => isDark.value ? DARK : LIGHT)

const sz = computed(() => props.size ?? 'small')
const sf: Record<ComponentSize, number> = { tiny: 12, small: 13, medium: 14, large: 15 }
const editorFontSize = computed(() => sf[sz.value])

const cl = (m: Record<string, string>) => computed(() => m[sz.value] ?? m.small ?? '')
const hPC = cl({ tiny: 'px-2 py-1', small: 'px-4 py-2', medium: 'px-5 py-2.5', large: 'px-6 py-3' })
const hTC = cl({ tiny: 'text-xs', small: 'text-sm', medium: 'text-base', large: 'text-lg' })

// CodeMirror 内部元素样式（替代原 .size--* :deep 规则）
const cm = computed(() => ({
  tiny: {
    content: '[&_.cm-content]:!p-[8px]',
    gutters: '[&_.cm-gutters]:!min-w-[36px]',
    line: '[&_.cm-lineNumbers_.cm-gutterElement]:text-[10px] [&_.cm-lineNumbers_.cm-gutterElement]:!px-1.5',
  },
  small: {
    content: '[&_.cm-content]:!p-[12px]',
    gutters: '[&_.cm-gutters]:!min-w-[48px]',
    line: '',
  },
  medium: {
    content: '[&_.cm-content]:!p-[16px]',
    gutters: '[&_.cm-gutters]:!min-w-[52px]',
    line: '',
  },
  large: {
    content: '[&_.cm-content]:!p-[20px]',
    gutters: '[&_.cm-gutters]:!min-w-[56px]',
    line: '',
  },
})[sz.value])

const cStyle = computed(() => {
  if (typeof props.height === 'number') return { height: `${props.height}px` }
  if (props.height) return { height: props.height }
  return { minHeight: '200px' }
})

const A = () => props.authentication
const B = () => props.principal
const L = () => props.locals
const G = () => props.globals
const M = () => props.methods

const toO = (e: SpelEntry[], p: string) => {
  const l = p.toLowerCase()
  return e.filter(x => x.label.toLowerCase().startsWith(l)).map(x => ({ label: x.label, type: x.type, detail: x.detail }))
}

function fieldO(r: ElementField, pfx: string, part: string) {
  if (r.type === 'object' && r.children) return toO(buildFilterFieldEntries(r.children, pfx, t), part)
  if (r.type === 'string') return toO(buildStringMethodEntries(t), part)
  if (r.type === 'array') {
    if (r.elementFields) return toO(buildFilterFieldEntries(r.elementFields, pfx, t), part)
    return toO(buildArrayMethodEntries({ elementType: r.elementType ?? 'string' }, t), part)
  }
  return []
}

function filterCtx(ap: string, inside: string, pos: number) {
  const meta = buildArrayMeta(A(), B(), L(), G())[ap]
  if (!meta) return null
  const di = inside.lastIndexOf('.')
  if (di >= 0) {
    const pfx = inside.slice(0, di)
    const part = inside.slice(di + 1)
    if (pfx === '#this') {
      if (meta.elementType === 'string') return { from: pos - part.length, options: toO(buildStringMethodEntries(t), part) }
      if (meta.elementType === 'array') return { from: pos - part.length, options: toO(buildArrayMethodEntries({ elementType: meta.elementType }, t), part) }
    }
    if (meta.elementType === 'object' && meta.elementFields) {
      const r = resolveFieldPath(meta.elementFields, pfx)
      if (r) return { from: pos - part.length, options: fieldO(r, pfx, part) }
    }
  } else {
    const all: SpelEntry[] = []
    if (meta.elementType === 'object' && meta.elementFields) all.push(...buildFilterFieldEntries(meta.elementFields, '', t))
    all.push({ label: '#this', type: 'variable', detail: meta.elementType ?? 'any', desc: t('completions.currentElement'), extra: '' })
    return { from: pos - inside.length, options: toO(all, inside) }
  }
  return null
}

const extensions = computed(() => {
  // 追踪上下文依赖，变化时重新构建 completionSource
  void A()
  void B()
  void L()
  void G()
  void M()
  const source: import('@codemirror/autocomplete').CompletionSource = (ctx) => {
    const word = ctx.matchBefore(/[#a-zA-Z_][\w#.]*/)
    const pos = ctx.pos
    const before = ctx.state.sliceDoc(Math.max(0, pos - 200), pos)
    const lm = before.match(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")\.([\w]*)$/)
    if (lm) return { from: pos - (lm[2]?.length ?? 0), options: toO(buildStringMethodEntries(), lm[2] ?? '') }
    const fm = before.match(/(\w+(?:\.\w+)*)\.([?!])[[]([^[\]]*)$/)
    if (fm) {
      const r = filterCtx(fm[1]!, fm[3]!, pos)
      if (r) return r
    }
    if (!word || (word.from === word.to && !ctx.explicit)) return null
    const text = word.text
    const di = text.lastIndexOf('.')
    if (di > 0) {
      const base = text.slice(0, di)
      const part = text.slice(di + 1)
      const type = buildTypeMap(A(), B(), L(), G())[base]
      if (type === 'string') return { from: word.from + di + 1, options: toO(buildStringMethodEntries(t), part) }
      if (type === 'array') {
        const am = buildArrayMeta(A(), B(), L(), G())[base]
        return { from: word.from + di + 1, options: toO(buildArrayMethodEntries(am, t), part) }
      }
    }
    const lower = text.toLowerCase()
    const opts = buildEntries(A(), B(), L(), M(), t, G()).filter(e => e.label.toLowerCase().startsWith(lower))
    return {
      from: word.from,
      options: opts.map(e => {
        const txt = e.insert || e.label
        return { label: e.label, type: e.type, detail: e.detail, apply: (v: EditorView) => v.dispatch({ changes: { from: word.from, to: word.to, insert: txt } }) }
      }),
    }
  }

  const tooltip = hoverTooltip((view, pos) => {
    const token = getTokenAt(view.state.doc, pos)
    if (!token) return null
    const entry = buildEntries(A(), B(), L(), M(), t, G()).find(e => e.label === token.text)
    if (!entry) return null
    return { pos: token.from, end: token.to, above: true, create: () => ({ dom: buildHoverTooltipDom(entry, T.value) }) }
  }, { hoverTime: 300 })

  return [
    buildExtensions(T.value, isDark.value, editorFontSize.value, source, tooltip),
    keymap.of([indentWithTab]),
    EditorState.tabSize.of(2),
  ]
})

function createView() {
  if (!cmRef.value || view) return
  view = new EditorView({
    state: EditorState.create({
      doc: internalValue.value,
      extensions: extensions.value,
    }),
    parent: cmRef.value,
    dispatch: (tr) => {
      view?.update([tr])
      if (tr.docChanged && !tr.annotation(externalChange)) {
        handleInput(view!.state.doc.toString())
      }
    },
  })
}

onMounted(createView)
onUnmounted(() => {
  view?.destroy()
  view = null
})

watch(extensions, (next) => {
  if (!view) return
  view.dispatch({ effects: StateEffect.reconfigure.of(next) })
})

watch(() => props.modelValue, (nv) => {
  if (!view) return
  if (view.state.doc.toString() !== nv) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: nv },
      annotations: externalChange.of(true),
    })
  }
})

const focus = () => view?.focus()
defineExpose<SpelEditorInstance>({ getValue, setValue, validate: handleValidate, run, focus })
</script>

<template>
  <div class="spel-query-builder" style="display: contents">
  <div v-bind="$attrs" class="rounded-lg overflow-hidden shadow-lg flex flex-col"
    :class="[isDark ? 'border-gray-700' : 'border-gray-200']"
    :style="[cStyle, { borderWidth: '1px', borderStyle: 'solid' }]">
    <div class="flex items-center justify-between select-none" :class="hPC"
      :style="{ background: `linear-gradient(to right, ${T.headerFrom}, ${T.headerTo})` }">
      <span class="flex items-center gap-2 text-white font-medium" :class="hTC">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg> {{ t('spelEditor.title') }}
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-red-400/80"/>
        <span class="w-2.5 h-2.5 rounded-full bg-yellow-400/80"/>
        <span class="w-2.5 h-2.5 rounded-full bg-green-400/80"/>
      </span>
    </div>
    <div ref="cmRef"
      class="flex-1 overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor.cm-focused]:[outline:none] [&_.cm-scroller]:overflow-auto"
      :class="[cm.content, cm.gutters, cm.line]" />
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition-all duration-200 ease-out"
      leave-from-class=""
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="!validation.valid" class="flex items-center gap-2 px-4 py-2 text-sm border-t"
        :style="{ background: T.errBg, borderColor: T.errBorder, color: T.errFg }">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg> {{ validation.error }}
      </div>
    </Transition>
  </div>
  </div>
</template>
