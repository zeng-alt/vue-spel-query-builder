declare module 'spel2js' {
  export interface EvaluationContext {
    [key: string]: any
  }

  export interface CompiledExpression {
    eval(context?: EvaluationContext, locals?: Record<string, any>): any
  }

  export const StandardContext: {
    create(authentication?: any, principal?: any): EvaluationContext
  }

  export const SpelExpressionEvaluator: {
    compile(expression: string): CompiledExpression

    eval(expression: string, context?: EvaluationContext, locals?: Record<string, any>): any
  }
}
