declare module 'spel2js' {
  export interface EvaluationContext {
    [key: string]: unknown
  }

  export interface CompiledExpression {
    eval(context?: EvaluationContext, locals?: Record<string, unknown>): unknown
  }

  export const StandardContext: {
    create(authentication?: unknown, principal?: unknown): EvaluationContext
  }

  export const SpelExpressionEvaluator: {
    compile(expression: string): CompiledExpression

    eval(expression: string, context?: EvaluationContext, locals?: Record<string, unknown>): unknown
  }
}
