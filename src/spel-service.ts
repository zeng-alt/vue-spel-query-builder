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
   * 注册自定义方法。调用 eval 时会自动合并到 locals 中，确保 spel2js 能正确调用。
   */
  setMethods(methods?: CustomMethod[], fnImpl?: Record<string, (...args: any[]) => any>) {
    if (!methods || !fnImpl) {
      this.methods = undefined
      return
    }
    this.methods = {}
    for (const m of methods) {
      if (fnImpl[m.name]) {
        this.methods[m.name] = fnImpl[m.name]
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
    // 合并自定义方法到 locals，确保 spel2js 能正确调用
    let mergedLocals = locals
    if (this.methods) {
      mergedLocals = { ...(locals ?? {}), ...this.methods }
    }
    return SpelExpressionEvaluator.eval(expression, this.getContext(), mergedLocals)
  }
}

export const spelService = new SpelService()
