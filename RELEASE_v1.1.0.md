# Release v1.1.0 — SpEL 表达式解析引擎 & 自定义方法支持

## 🚀 新功能

### 1. SpEL → RuleNode 逆向解析 (`spelToRuleNode`)
之前只能从规则树生成 SpEL 表达式，现在支持将 SpEL 表达式字符串解析回规则树。

```typescript
import { spelToRuleNode } from '@zeng-alt/vue-spel-query-builder'

const node = spelToRuleNode("#user.age > 18 && (#user.name == '张三' || #user.email != null)")
```

**支持的表达式模式：**
| 类别 | 示例 |
|------|------|
| 分组 | `(A && B)`, `(A \|\| B)`, `!(A)` |
| 条件 | `field == value`, `#user.age > 18` |
| 特殊比较 | `field == null`, `field == null \|\| field.isEmpty()` |
| 列表过滤 | `field.?[#this > 5]`, `field.?[code == 'admin']` |
| Count | `field.size() >= 2`, `field.?[code == 'admin'].size() == 1` |

组件方法：
```typescript
const ruleTreeRef = ref<RuleTreeInstance>()
ruleTreeRef.value?.setSpelExpression("#user.age > 18")
```

---

### 2. 自定义方法支持 (`CustomMethod`)
支持在组件中注入独立函数（无调用方），自动在编辑器中提示并在运行时正确执行。

```typescript
import type { CustomMethod } from '@zeng-alt/vue-spel-query-builder'

const methods: CustomMethod[] = [
  {
    name: 'isEmpty',
    argumentCount: 1,
    params: [{ name: 'value', type: 'any' }],
    returnType: 'boolean',
    description: '判断字符串或数组是否为空',
    fn: (value: unknown) => value == null || ...,
  },
]
```

**在 SpelEditor 中使用：**
```vue
<SpelEditor :methods="methods" :locals="locals" />
```
- 输入 `isEmpty(` 时自动提示
- 选中后插入 `isEmpty(` 并自动补全左括号
- 运行时会自动将 `fn` 实现注入到 spel2js 上下文

**在 RuleTree 中使用：**
```vue
<RuleTree :methods="methods" :locals="locals" />
```
- 表达式编辑器中选择「方法」类型
- 下拉框中显示方法名（如 `isEmpty`）
- 选择后创建带参数占位符的方法调用

---

### 3. 上下文动态编辑
**SpelEditor** 和 **RuleTree** 的 playground 均支持实时编辑 `authentication`、`principal`、`locals` 三个上下文对象：

- 增删属性后自动刷新字段提示
- 无需重启开发服务器
- RuleTree 的级联选择器即时更新

---

### 4. 自动补全实时刷新
SpelEditor 的 `extensions` computed 现在显式追踪上下文依赖：
```typescript
void A(); void B(); void L(); void M()
```
当 `authentication` / `principal` / `locals` / `methods` 变化时，自动重建 CodeMirror 补全源。

---

## 🐛 Bug 修复

| 问题 | 修复 |
|------|------|
| 列表过滤 `[]` 内表达式解析错误 | `bareFieldCond` 模式匹配 |
| 列表过滤 + count 组合解析丢失 | count 左值嵌套检测 |
| 条件级 comparator 被列表过滤跳过 | 提前返回条件修正 |
| `findTopLevelOperator` 未追踪 `[]` 深度 | 新增 `bracketDepth` 追踪 |
| `splitTopLevel` 未追踪 `[]` 深度 | 新增 `[]` 深度计数 |
| watch 误清除 `listFilter`（新节点挂载时） | 改用 `path` 值比较而非引用比较 |
| 独立函数格式化错误（`calculate == 3`） | `formatExpression` 自动拼接参数 |
| `buildArrayMeta` 参数数量不匹配 | 新增 `_methods` 可选参数 |
| 自定义方法未合并到 spel2js 上下文 | `SpelService.setMethods` 自动提取 |

---

## 🔧 架构改进

- **`SpelService`**：新增 `setMethods()` 方法，从 `CustomMethod[].fn` 提取实现并自动合并到 `locals`
- **`buildEntries`**：接收 `methods` 参数，自定义方法显示为独立函数条目
- **`ExpressionEditor`**：支持自定义方法的 `params` 和 `returnType` 显示
- **类型导出**：新增 `CustomMethod`、`CustomMethodParam` 类型

---

## 📦 安装

```bash
npm install @zeng-alt/vue-spel-query-builder
# 或
pnpm add @zeng-alt/vue-spel-query-builder
```

## 📖 快速开始

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SpelEditor, RuleTree, createEmptyGroup } from '@zeng-alt/vue-spel-query-builder'
import type { CustomMethod, RuleNode } from '@zeng-alt/vue-spel-query-builder'
import '@zeng-alt/vue-spel-query-builder/style.css'

const methods: CustomMethod[] = [
  {
    name: 'isEmpty',
    argumentCount: 1,
    params: [{ name: 'value', type: 'any' }],
    returnType: 'boolean',
    fn: (v: unknown) => String(v).trim().length === 0,
  },
]

const auth = { details: { name: 'John' } }
const locals = { user: { name: 'Alice', age: 30 } }
const expression = ref('')
const ruleData = ref<RuleNode>(createEmptyGroup('and'))
</script>

<template>
  <SpelEditor v-model="expression" :authentication="auth" :locals="locals" :methods="methods" />
  <RuleTree v-model="ruleData" :authentication="auth" :locals="locals" :methods="methods" />
</template>
```

## 🔄 迁移指南（从 v1.0）

v1.0 → v1.1 无需破坏性变更，新增功能均为向后兼容：

- `spelToRuleNode()` — 新导出函数
- `CustomMethod` / `CustomMethodParam` — 新导出类型
- `methods` prop — SpelEditor 和 RuleTree 新增可选属性
- `setSpelExpression()` — RuleTree 实例方法（之前为空壳，现已实现）
