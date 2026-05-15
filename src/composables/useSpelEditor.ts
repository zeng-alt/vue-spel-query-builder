import { ref, watch, computed } from 'vue'
import { StandardContext, SpelExpressionEvaluator } from 'spel2js'
import { validateSpelExpression } from '../utils'
import type { SpelEditorProps } from '../types'

export function useSpelEditor(props: SpelEditorProps, emit: any) {
  const internalValue = ref(props.modelValue)
  const isFocused = ref(false)
  const validation = ref<{ valid: boolean; error?: string }>({ valid: true })

  const heightStyle = computed(() => {
    if (typeof props.height === 'number') {
      return { height: `${props.height}px` }
    }
    return { height: props.height || '400px' }
  })

  const handleInput = (value: string) => {
    internalValue.value = value
    emit('update:modelValue', value)
    emit('change', value)
  }

  const handleValidate = async () => {
    validation.value = validateSpelExpression(internalValue.value, props.locals)
    emit('validate', validation.value.valid, validation.value.error)
    return validation.value.valid
  }

  const run = async (): Promise<any> => {
    try {
      const expression = internalValue.value
      const spelContext = StandardContext.create(props.authentication, props.principal)
      const result = SpelExpressionEvaluator.eval(expression, spelContext, props.locals)
      
      emit('run', result, undefined)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '执行表达式时发生错误'
      emit('run', undefined, errorMessage)
      return undefined
    }
  }

  const setValue = (value: string) => {
    internalValue.value = value
    emit('update:modelValue', value)
  }

  const getValue = () => internalValue.value

  watch(() => props.modelValue, (newValue) => {
    internalValue.value = newValue
  })

  return {
    internalValue,
    isFocused,
    validation,
    heightStyle,
    handleInput,
    handleValidate,
    setValue,
    getValue,
    run,
  }
}
