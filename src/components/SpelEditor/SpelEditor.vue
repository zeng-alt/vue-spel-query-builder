<script setup lang="ts">
/**
 * SpelEditor.vue - SpEL 表达式编辑器组件
 * 
 * 【上下文变量说明】
 * - authentication: 用户认证信息（如登录用户的基本信息）
 * - principal: 基础变量信息（业务逻辑中的主要数据对象）
 * - locals: 本地变量集合，使用 # 前缀访问（如 #变量名）
 * 
 * 【补全项类型说明】
 * - variable: 变量名（蓝色标签）
 * - property: 对象属性（绿色标签）
 * - keyword: 关键字（紫色标签）
 * - function: 函数（黄色标签）
 */

// 导入 Vue 响应式 API
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

// CodeMirror 6 编辑器核心
import { EditorView, basicSetup } from 'codemirror'  // basicSetup: 包含基本编辑功能的组合扩展
import { EditorState } from '@codemirror/state'       // EditorState: 编辑器状态管理

// 自动补全功能
import { autocompletion, Completion, CompletionSource, CompletionContext } from '@codemirror/autocomplete'

// 语法高亮功能
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'  // tags: 预定义的高亮标签（keyword, string, number 等）

// SpEL 编辑器业务逻辑
import { useSpelEditor } from '../../composables'

// 类型定义
import type { SpelEditorProps, SpelEditorEmits, SpelEditorInstance } from '../../types'

// Props 定义：接收父组件传入的上下文变量
const props = defineProps<SpelEditorProps>()

// 事件定义：向父组件通知输入、验证、运行等事件
const emit = defineEmits<SpelEditorEmits>()

// 使用编辑器业务逻辑 hook
const { internalValue, validation, handleInput, handleValidate, setValue, getValue, run } = useSpelEditor(props, emit)

// 编辑器 DOM 引用
const editorRef = ref<HTMLDivElement>()

// CodeMirror 编辑器实例
let view: EditorView | null = null

// 聚焦到编辑器
const focus = () => {
  view?.focus()
}

// 计算容器样式，支持数字高度（px）和字符串高度（auto, 100% 等）
const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (typeof props.height === 'number') {
    style.height = `${props.height}px`
  } else if (props.height) {
    style.height = props.height
  } else {
    style.minHeight = '200px'
  }
  return style
})

/**
 * 语法高亮样式定义
 * 使用 @lezer/highlight 的 tags 来匹配不同类型的语法元素
 * 
 * 【配色说明】
 * - keyword (关键字): #c678dd (紫色) - true, false, null, and, or, not
 * - operator (操作符): #e06c75 (红色) - ==, !=, >, < 等
 * - string (字符串): #98c379 (绿色) - "hello", 'world'
 * - number (数字): #d19a66 (橙色) - 1, 2.5, 100
 * - bool (布尔值): #d19a66 (橙色) - true, false
 * - null: #d19a66 (橙色) - null
 * - variableName (变量名): #61afef (蓝色) - authentication, principal
 * - propertyName (属性名): #98c379 (绿色) - .name, .id
 * - function (函数): #e6c07b (黄色) - contains(), startsWith()
 * - comment (注释): #5c6370 (灰色，斜体)
 */
const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c678dd' },              // 关键字
  { tag: tags.operator, color: '#e06c75' },             // 操作符
  { tag: tags.string, color: '#98c379' },               // 字符串
  { tag: tags.number, color: '#d19a66' },                // 数字
  { tag: tags.bool, color: '#d19a66' },                 // 布尔值
  { tag: tags.null, color: '#d19a66' },                  // 空值
  { tag: tags.variableName, color: '#61afef' },         // 变量名
  { tag: tags.propertyName, color: '#98c379' },         // 属性名
  { tag: tags.function(tags.variableName), color: '#e6c07b' }, // 函数
  { tag: tags.comment, color: '#5c6370', fontStyle: 'italic' }, // 注释
])

// 编辑器主题配置，为 CodeMirror 内置类添加样式
const spelHighlightExtension = EditorView.theme({
  '&.cm-editor .cm-keyword': { color: '#c678dd' },
  '&.cm-editor .cm-operator': { color: '#e06c75' },
  '&.cm-editor .cm-string': { color: '#98c379' },
  '&.cm-editor .cm-number': { color: '#d19a66' },
  '&.cm-editor .cm-boolean': { color: '#d19a66' },
  '&.cm-editor .cm-null': { color: '#d19a66' },
  '&.cm-editor .cm-spel': { color: '#61afef' },
  '&.cm-editor .cm-variable': { color: '#61afef' },
  '&.cm-editor .cm-property': { color: '#98c379' },
  '&.cm-editor .cm-function': { color: '#e6c07b' },
  '&.cm-editor .cm-comment': { color: '#5c6370', fontStyle: 'italic' },
})

// 事务过滤器（预留扩展点）
const spelHighlightPlugin = EditorState.transactionFilter.of((tr) => {
  return tr
})

/**
 * 构建自动补全列表
 * 
 * 【补全项类型详解】
 * - type: 'variable' - 顶级变量（如 authentication, principal）
 * - type: 'property' - 对象属性（如 .name, .id）
 * - type: 'keyword' - 关键字（如 true, false, and, or）
 * - type: 'function' - 函数（如 contains(), startsWith()）
 * 
 * 【上下文变量使用方式】
 * - authentication: 直接使用，如 authentication.name
 * - principal: 直接使用，如 principal.id
 * - locals: 使用 # 前缀，如 #userId, #orderId
 */
const buildCompletions = (): Completion[] => {
  const completions: Completion[] = []

  // 【authentication】用户认证信息
  // 用途：存储当前登录用户的相关信息
  // 使用方式：authentication.属性名
  // 示例：authentication.name, authentication.roles, authentication.details.email
  if (props.authentication) {
    completions.push({ label: 'authentication', type: 'variable', detail: '用户认证信息', info: '用户认证信息' })
    for (const key of Object.keys(props.authentication)) {
      completions.push({ label: `authentication.${key}`, type: 'property', detail: `authentication 属性: ${key}`, info: `authentication 属性: ${key}` })
      const value = props.authentication[key]
      if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          completions.push({ label: `authentication.${key}.${subKey}`, type: 'property', detail: `authentication.${key} 属性: ${subKey}`, info: `authentication.${key} 属性: ${subKey}` })
        }
      }
    }
  }

  // 【principal】基础变量信息
  // 用途：业务逻辑中的主要数据对象，可以是订单、产品、部门等
  // 使用方式：principal.属性名
  // 示例：principal.id, principal.status, principal.owner.name
  if (props.principal) {
    completions.push({ label: 'principal', type: 'variable', detail: '基础变量信息', info: '基础变量信息' })
    for (const key of Object.keys(props.principal)) {
      completions.push({ label: `principal.${key}`, type: 'property', detail: `principal 属性: ${key}`, info: `principal 属性: ${key}` })
      const value = props.principal[key]
      if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          completions.push({ label: `principal.${key}.${subKey}`, type: 'property', detail: `principal.${key} 属性: ${subKey}`, info: `principal.${key} 属性: ${subKey}` })
        }
      }
    }
  }

  // 【locals】本地变量集合
  // 用途：用户自定义的业务变量，使用 # 前缀访问
  // 使用方式：#变量名
  // 示例：#userId, #departmentId, #startDate, #endDate
  if (props.locals) {
    for (const key of Object.keys(props.locals)) {
      completions.push({ label: `#${key}`, type: 'variable', detail: `locals 变量: ${key}`, info: `locals 变量: ${key}` })
      const value = props.locals[key]
      if (typeof value === 'object' && value !== null) {
        for (const subKey of Object.keys(value)) {
          completions.push({ label: `#${key}.${subKey}`, type: 'property', detail: `#${key} 属性: ${subKey}`, info: `#${key} 属性: ${subKey}` })
        }
      }
    }
  }

  // 【SpEL 内置关键字】
  // - true/false: 布尔值
  // - null: 空值
  // - and/or/not: 逻辑运算
  completions.push(
    { label: 'true', type: 'keyword', detail: '布尔值 true', info: '布尔值 true' },
    { label: 'false', type: 'keyword', detail: '布尔值 false', info: '布尔值 false' },
    { label: 'null', type: 'keyword', detail: '空值', info: '空值' },
    { label: 'and', type: 'keyword', detail: '逻辑与', info: '逻辑与' },
    { label: 'or', type: 'keyword', detail: '逻辑或', info: '逻辑或' },
    { label: 'not', type: 'keyword', detail: '逻辑非', info: '逻辑非' },
  )

  // 【SpEL 内置函数】
  // - contains: 包含判断，如 name.contains('test')
  // - startsWith/endsWith: 字符串开头/结尾匹配
  // - matches: 正则表达式匹配
  // - isEmpty: 判断是否为空
  // - size()/length(): 获取长度
  completions.push(
    { label: 'contains', type: 'function', detail: '包含', info: '包含' },
    { label: 'startsWith', type: 'function', detail: '开头匹配', info: '开头匹配' },
    { label: 'endsWith', type: 'function', detail: '结尾匹配', info: '结尾匹配' },
    { label: 'matches', type: 'function', detail: '正则匹配', info: '正则匹配' },
    { label: 'isEmpty', type: 'function', detail: '为空', info: '为空' },
    { label: 'size()', type: 'function', detail: '获取长度', info: '获取长度' },
    { label: 'length()', type: 'function', detail: '获取长度', info: '获取长度' }
  )

  return completions
}

/**
 * 自动补全源函数
 * 当用户在编辑器中输入时触发，提供上下文感知的自动补全
 * 
 * @param context - CodeMirror 的补全上下文，包含当前光标位置和已输入文本
 * @returns 补全结果，包含匹配项列表
 * 
 * 【匹配逻辑】
 * - 匹配以 #、字母、下划线、点号开头的单词
 * - 不区分大小写匹配
 * - 自动应用选中的补全项到编辑器
 */
const spellCompletionSource: CompletionSource = (context: CompletionContext) => {
  // 匹配当前光标前的单词（支持 # 前缀的对象访问）
  const word = context.matchBefore(/[#a-zA-Z_.]+/)
  if (!word) return null

  // 构建所有可能的补全项
  const completions = buildCompletions()
  
  // 过滤出匹配的补全项（不区分大小写）
  const results = completions
    .filter(c => c.label.toLowerCase().startsWith(word.text.toLowerCase()))
    .map(c => {
      // 确保同时包含 detail 和 info 字段，兼容不同版本的 CodeMirror
      const completion: any = {
        label: c.label,
        type: c.type,
        detail: (c as any).detail || (c as any).info || '',
        info: (c as any).info || (c as any).detail || '',
        apply: (view: EditorView) => {
          view.dispatch({
            changes: {
              from: word.from,  // 替换起始位置
              to: word.to,      // 替换结束位置
              insert: c.label,  // 插入的文本
            },
          })
        },
      }
      return completion
    })

  // 返回补全结果
  return {
    from: word.from,
    options: results,
  }
}

// 【暴露给父组件的方法】
// 通过模板 ref 可以访问以下方法：
// - getValue(): 获取当前编辑器内容
// - setValue(value): 设置编辑器内容
// - validate(): 验证表达式
// - run(): 运行表达式
// - focus(): 聚焦编辑器
defineExpose<SpelEditorInstance>({
  getValue,
  setValue,
  validate: handleValidate,
  run,
  focus,
})

// 【组件挂载时初始化编辑器】
onMounted(() => {
  if (editorRef.value) {
    // 创建编辑器初始状态
    const startState = EditorState.create({
      doc: internalValue.value,  // 初始内容
      extensions: [
        basicSetup,                        // 基本编辑功能（行号、撤销、重做等）
        syntaxHighlighting(darkHighlightStyle), // 语法高亮
        spelHighlightExtension,             // 编辑器主题样式
        autocompletion({ 
          override: [spellCompletionSource],
          defaultKeymap: true,
          closeOnBlur: false,
          activateOnTyping: true,
          tooltipClass: () => 'custom-autocomplete-tooltip'
        }), // 自动补全
        // 监听文档变化，同步到父组件
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            handleInput(update.state.doc.toString())
          }
        }),
      ],
    })

    // 创建编辑器实例并挂载到 DOM
    view = new EditorView({
      state: startState,
      parent: editorRef.value,
    })
  }
})

// 【监听外部 modelValue 变化，同步到编辑器】
// 用于父组件通过 v-model 或 :model-value 控制编辑器内容
watch(() => props.modelValue, (newValue) => {
  if (view && view.state.doc.toString() !== newValue) {
    // 使用事务替换编辑器内容
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newValue,
      },
    })
  }
})

// 【组件卸载时清理编辑器资源】
onBeforeUnmount(() => {
  view?.destroy()
})
</script>

<template>
  <!-- 编辑器容器 -->
  <!-- 样式：深色边框、圆角、阴影、响应式高度 -->
  <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-gray-900" :style="containerStyle">
    <!-- 标题栏：模拟窗口控制按钮 -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 flex items-center justify-between">
      <span class="text-white text-sm font-medium flex items-center gap-2">
        <!-- 代码图标 -->
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
        </svg>
        SpEL Editor
      </span>
      <!-- 模拟窗口控制按钮（红、黄、绿） -->
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-400"></span>
        <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
        <span class="w-2 h-2 rounded-full bg-green-400"></span>
      </div>
    </div>
    <!-- CodeMirror 编辑器挂载点 -->
    <div ref="editorRef" class="h-[calc(100%-40px)]"></div>
    <!-- 错误提示区域：表达式验证失败时显示 -->
    <div v-if="!validation.valid" class="px-4 py-2 bg-red-900/80 text-red-300 text-sm border-t border-red-700 flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      {{ validation.error }}
    </div>
  </div>
</template>

<style scoped>
/* CodeMirror 编辑器基础样式 */
:deep(.cm-editor) {
  height: 100%;
  /* 代码字体优先顺序：Fira Code > JetBrains Mono > Monaco > Consolas */
  font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  background-color: #1a1a2e !important;  /* 深色背景 */
  color: #e5e5e5;                         /* 默认文字颜色 */
}

/* 编辑器滚动区域 */
:deep(.cm-editor .cm-scroller) {
  overflow: auto;
  background-color: #1a1a2e !important;
}

/* 编辑内容区域 */
:deep(.cm-editor .cm-content) {
  padding: 12px;            /* 内边距 */
  caret-color: #61afef;     /* 光标颜色 */
  color: #e5e5e5;
}

/* 编辑器行样式 */
:deep(.cm-editor .cm-line) {
  padding: 2px 0;
  color: #e5e5e5;
}

/* 当前行高亮 */
:deep(.cm-editor .cm-activeLine) {
  background-color: rgba(97, 175, 239, 0.1) !important;  /* 蓝色半透明背景 */
}

/* 当前行行号区域高亮 */
:deep(.cm-editor .cm-activeLineGutter) {
  background-color: rgba(97, 175, 239, 0.15) !important;
}

/* 光标样式 */
:deep(.cm-editor .cm-cursor) {
  border-left-color: #61afef;  /* 蓝色光标 */
  border-left-width: 2px;      /* 光标宽度 */
}

/* 选中文本背景 */
:deep(.cm-editor .cm-selectionBackground) {
  background-color: rgba(97, 175, 239, 0.3) !important;
}

/* 行号区域 */
:deep(.cm-editor .cm-gutters) {
  background-color: #16213e !important;  /* 行号栏背景 */
  border-right: 1px solid #3e4451;        /* 右边框分隔线 */
  min-width: 50px;                        /* 最小宽度 */
}

/* 行号数字样式 */
:deep(.cm-editor .cm-lineNumbers .cm-gutterElement) {
  color: #5c6370;     /* 灰色行号 */
  padding: 0 12px;   /* 内边距 */
  font-size: 12px;    /* 较小字号 */
  text-align: right;  /* 右对齐 */
}

/* 自动补全提示框容器 */
:deep(.cm-editor .cm-tooltip-autocomplete) {
  background-color: #282c34 !important;  /* 深灰背景 */
  border: 1px solid #3e4451;             /* 边框 */
  border-radius: 8px;                    /* 圆角 */
  padding: 4px;                          /* 内边距 */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);  /* 阴影 */
  max-height: 300px;                     /* 最大高度 */
  overflow: hidden;
}

/* 自动补全列表 */
:deep(.cm-editor .cm-tooltip-autocomplete > ul) {
  max-height: 300px;
  overflow-y: auto;           /* 垂直滚动 */
  overflow-x: hidden;         /* 禁用水平滚动 */
  scrollbar-width: thin;      /* Firefox 滚动条 */
  scrollbar-color: #5c6370 #282c34;  /* 滚动条颜色 */
}

/* Webkit 滚动条轨道（Chrome/Safari） */
:deep(.cm-editor .cm-tooltip-autocomplete > ul::-webkit-scrollbar) {
  width: 6px;  /* 滚动条宽度 */
}

:deep(.cm-editor .cm-tooltip-autocomplete > ul::-webkit-scrollbar-track) {
  background: #282c34;      /* 轨道背景 */
  border-radius: 3px;        /* 圆角 */
}

:deep(.cm-editor .cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb) {
  background-color: #5c6370;  /* 滚动条滑块 */
  border-radius: 3px;
}

:deep(.cm-editor .cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb:hover) {
  background-color: #7c8a9a;  /* 悬停时变亮 */
}

/* 补全项样式 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem) {
  padding: 8px 12px;        /* 内边距 */
  border-radius: 4px;       /* 圆角 */
  display: flex;           /* 弹性布局 */
  align-items: center;     /* 垂直居中 */
  gap: 12px;               /* 元素间距 */
  cursor: pointer;         /* 指针光标 */
  color: #e5e5e5;          /* 文字颜色 */
}

/* 补全项悬停状态 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem:hover) {
  background-color: rgba(97, 175, 239, 0.2);  /* 蓝色半透明背景 */
}

/* 选中的补全项 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem.cm-selected) {
  background-color: rgba(97, 175, 239, 0.3);
}

/* 自动补全提示框容器 - 确保足够宽 */
:deep(.cm-editor .cm-tooltip-autocomplete) {
  min-width: 400px !important;
  max-width: 500px !important;
}

/* 补全项内部结构 - 确保是 flex 布局 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem) {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 100% !important;
}

/* 补全项的内容部分 - label */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem > *:first-child),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem .cm-completionLabel) {
  flex: 0 0 auto;
  font-weight: 500;
  color: #e5c07b;
  margin-right: 8px;
}

/* 补全项说明（detail 字段）- 显示在右侧 - 确保优先级最高 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem .cm-completionDetail) {
  color: #9da5b4 !important;
  font-size: 12px !important;
  margin-left: auto !important;
  padding-left: 12px !important;
  opacity: 0.9 !important;
  max-width: 250px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  flex: 0 0 auto !important;
  display: block !important;
}

/* 同时支持所有可能的说明类名 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem .cm-completionInfo),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem [class*="detail"]),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem [class*="info"]) {
  color: #9da5b4 !important;
  font-size: 12px !important;
  margin-left: auto !important;
  padding-left: 12px !important;
  opacity: 0.9 !important;
  max-width: 250px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: block !important;
}

/* 补全项说明在选中/悬停时更明显 */
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem:hover .cm-completionDetail),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem.cm-selected .cm-completionDetail),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem:hover .cm-completionInfo),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem.cm-selected .cm-completionInfo),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem:hover [class*="detail"]),
:deep(.cm-editor .cm-tooltip-autocomplete .cm-completionItem.cm-selected [class*="detail"]) {
  color: #e5e5e5 !important;
  opacity: 1 !important;
}

/* 补全项类型图标 */
:deep(.cm-editor .cm-completionIcon) {
  width: 16px;           /* 图标宽度 */
  height: 16px;          /* 图标高度 */
  border-radius: 4px;    /* 圆角 */
  display: flex;         /* 弹性布局 */
  align-items: center;   /* 居中 */
  justify-content: center;
  font-size: 10px;        /* 小字体 */
  font-weight: bold;     /* 粗体 */
  flex-shrink: 0;        /* 防止压缩 */
}

/* 变量类型图标：蓝色背景 - 用于 authentication, principal, #locals */
:deep(.cm-editor .cm-completionIcon.cm-variable) {
  background-color: #61afef;
  color: white;
}

/* 属性类型图标：绿色背景 - 用于对象属性如 .name, .id */
:deep(.cm-editor .cm-completionIcon.cm-property) {
  background-color: #98c379;
  color: #282c34;
}

/* 关键字类型图标：紫色背景 - 用于 true, false, and, or, not */
:deep(.cm-editor .cm-completionIcon.cm-keyword) {
  background-color: #c678dd;
  color: white;
}

/* 函数类型图标：黄色背景 - 用于 contains(), startsWith() 等 */
:deep(.cm-editor .cm-completionIcon.cm-function) {
  background-color: #e5c07b;
  color: #282c34;
}

/* 操作符类型图标：红色背景 */
:deep(.cm-editor .cm-completionIcon.cm-operator) {
  background-color: #e06c75;
  color: white;
}

/* 下划线样式 */
:deep(.cm-editor .cm-underline) {
  text-decoration: underline;
}

/* 语法关键字样式 */
:deep(.cm-editor .cm-syntaxKeyword) {
  color: #c678dd;  /* 紫色 */
}

/* 语法字符串样式 */
:deep(.cm-editor .cm-syntaxString) {
  color: #98c379;  /* 绿色 */
}

/* 语法数字样式 */
:deep(.cm-editor .cm-syntaxNumber) {
  color: #d19a66;  /* 橙色 */
}

/* 语法变量样式 */
:deep(.cm-editor .cm-syntaxVariable) {
  color: #61afef;  /* 蓝色 */
}

/* 语法函数样式 */
:deep(.cm-editor .cm-syntaxFunction) {
  color: #e6c07b;  /* 黄色 */
}

/* 语法操作符样式 */
:deep(.cm-editor .cm-syntaxOperator) {
  color: #e06c75;  /* 红色 */
}
</style>
