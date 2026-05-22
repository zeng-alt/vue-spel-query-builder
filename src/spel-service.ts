import { StandardContext, SpelExpressionEvaluator } from 'spel2js'

// wraps spel2js in a stateful service that simplifies evaluation
class SpelService {
  private context: any = null

  setContext(authentication?: any, principal?: any) {
    this.context = StandardContext.create(authentication, principal)
  }

  getContext() {
    return this.context
  }

  compile(expression: string) {
    return SpelExpressionEvaluator.compile(expression)
  }

  eval(expression: string, locals?: Record<string, any>) {
    return SpelExpressionEvaluator.eval(expression, this.getContext(), locals)
  }
}

export const spelService = new SpelService()
