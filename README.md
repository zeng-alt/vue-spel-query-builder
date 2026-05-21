# Vue SpEL Query Builder

A Vue 3 component library for building SpEL (Spring Expression Language) expressions with a visual rule tree and code editor.

## Features

- **SpEL Editor**: Code editor with syntax highlighting and autocomplete for SpEL expressions
- **Rule Tree**: Visual drag-and-drop interface for building complex boolean expressions
- **Vue 3**: Built with Vue 3 Composition API
- **TypeScript**: Full TypeScript support
- **Theme Support**: Light and dark theme support

## Installation

```bash
npm install @zeng-alt/vue-spel-query-builder
# or
yarn add @zeng-alt/vue-spel-query-builder
# or
pnpm add @zeng-alt/vue-spel-query-builder
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install vue@^3.5.0 naive-ui@^2.44.0
```

## Usage

### SpEL Editor

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SpelEditor } from '@zeng-alt/vue-spel-query-builder'
import '@zeng-alt/vue-spel-query-builder/style.css'

const expression = ref('authentication.details.name')

const authentication = {
  details: {
    name: 'John',
    email: 'john@example.com'
  }
}

const principal = {
  id: '12345'
}

const locals = {
  user: {
    name: 'John',
    age: 25
  }
}
</script>

<template>
  <SpelEditor
    v-model="expression"
    :authentication="authentication"
    :principal="principal"
    :locals="locals"
    :height="300"
    theme="dark"
  />
</template>
```

### Rule Tree

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RuleTree, createEmptyGroup } from '@zeng-alt/vue-spel-query-builder'
import type { RuleNode } from '@zeng-alt/vue-spel-query-builder'
import '@zeng-alt/vue-spel-query-builder/style.css'

const ruleData = ref<RuleNode>(createEmptyGroup('and'))

const context = {
  user: {
    name: '张三',
    age: 28,
    email: 'zhangsan@example.com',
    roles: ['admin', 'user'],
    active: true
  }
}
</script>

<template>
  <RuleTree
    v-model="ruleData"
    :context="context"
    :authentication="{ details: { name: 'John' } }"
    :principal="{ id: '123' }"
    :locals="context"
    theme="dark"
  />
</template>
```

## API

### SpelEditor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | SpEL expression value |
| `authentication` | `object` | `{}` | Authentication context |
| `principal` | `object` | `{}` | Principal context |
| `locals` | `object` | `{}` | Local variables (accessed with # prefix) |
| `height` | `number` | `300` | Editor height in pixels |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor theme |
| `disabled` | `boolean` | `false` | Disable the editor |

### RuleTree Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `RuleNode` | - | Rule tree data |
| `context` | `object` | `{}` | Context for field options |
| `authentication` | `object` | `{}` | Authentication context |
| `principal` | `object` | `{}` | Principal context |
| `locals` | `object` | `{}` | Local variables |
| `disabled` | `boolean` | `false` | Disable the rule tree |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme |

### Utility Functions

```typescript
import { 
  createEmptyGroup, 
  createEmptyCondition,
  validateSpelExpression,
  evalSpelExpression,
  ruleNodeToSpel
} from '@zeng-alt/vue-spel-query-builder'

// Create an empty group
const group = createEmptyGroup('and') // or 'or'

// Create an empty condition
const condition = createEmptyCondition()

// Validate SpEL expression
const isValid = validateSpelExpression('user.name == "John"')

// Evaluate SpEL expression
const result = evalSpelExpression('user.age > 18', { user: { age: 25 } })

// Convert rule node to SpEL string
const spel = ruleNodeToSpel(ruleNode)
```

## License

MIT
