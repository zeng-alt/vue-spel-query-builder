import { StandardContext, SpelExpressionEvaluator } from 'spel2js'
import type { CustomMethod } from './types'

// wraps spel2js in a stateful service that simplifies evaluation
class SpelService {
  private context: any = null
  private methods?: Record<string, (...args: any[]) => any>

  setContext(authentication?: any, principal?: any) {
    this.context = StandardContext.create(authentication, principal)
  }

  /**
   * 注册自定义方法。从 methods 中提取 fn 实现，eval 时自动合并到 locals 中。
   */
  setMethods(methods?: CustomMethod[]) {
    if (!methods) {
      this.methods = undefined
      return
    }
    this.methods = {}
    for (const m of methods) {
      if (typeof m.fn === 'function') {
        this.methods[m.name] = m.fn
      }
    }
  }

  getContext() {
    return this.context
  }

  compile(expression: string) {
    return SpelExpressionEvaluator.compile(expression)
  }

  eval(expression: string, locals?: Record<string, any>) {
    // 合并自定义方法到 context，确保 spel2js 能正确调用
    let mergedContext = this.getContext()
    if (this.methods) {
      mergedContext = { ...this.getContext(), ...this.methods }
    }
    return SpelExpressionEvaluator.eval(expression, mergedContext, locals)
  }
}

export const spelService = new SpelService()
