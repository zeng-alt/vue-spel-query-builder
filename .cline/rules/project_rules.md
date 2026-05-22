# vue-spel-query-builder 项目概览

这是一个基于vue3 spel2js codemirror naive-ui unocss 的在线编辑器和可视化规则树ui

## 项目特点

- 支持代码编程的方式，可以插入上下文，上下文中的内容可以提示
- 支持和可视化规则树ui，通过操作生成spel表达式，和通过spel表达式可视化，结果只能为bool类型

## spel2js示例

```js
import { StandardContext, SpelExpressionEvaluator } from 'spel2js'

const expression = '#toDoList.owner == authentication.details.name'
const spelContext = StandardContext.create(authentication, principal)
const locals = {
  toDoList: {
    owner: 'Darth Vader',
  },
}

SpelExpressionEvaluator.eval(expression, spelContext, locals) // true
```

```js
import { StandardContext, SpelExpressionEvaluator } from 'spel2js'

const expression = '#toDoList.owner == authentication.details.name'
const spelContext = StandardContext.create(authentication, principal)
const locals = {
  toDoList: {
    owner: 'Darth Vader',
  },
}

const compiledExpression = SpelExpressionEvaluator.compile(expression)

compiledExpression.eval(spelContext, locals) // true
```

## 核心配置文件

- [package.json](mdc:package.json) - 项目依赖和脚本配置
- [vite.config.ts](mdc:vite.config.ts) - Vite 构建配置
- [uno.config.ts](mdc:uno.config.ts) - UnoCSS 配置
