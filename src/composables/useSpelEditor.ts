import { ref, watch, computed } from 'vue'
import { spelService } from '../spel-service'
import { validateSpelExpression } from '../utils'
import type { SpelEditorProps } from '../types'
import { useSpelI18n } from './useSpelI18n'

export function useSpelEditor(
  props: SpelEditorProps,
  emit: (event: string, ...args: unknown[]) => void,
) {
  const { t } = useSpelI18n(props)
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
    validation.value = validateSpelExpression(internalValue.value)
    emit('validate', validation.value.valid, validation.value.error)
    return validation.value.valid
  }

  const run = async (): Promise<unknown> => {
    try {
      const expression = internalValue.value
      spelService.setContext(props.authentication, props.principal)
      spelService.setMethods(props.methods)
      const result = spelService.eval(expression, props.locals)

      emit('run', result, undefined)
      return result
    } catch (error) {
      const errorMessage = getErrorMessage(error) || t('error.runExpression')
      emit('run', undefined, errorMessage)
      return undefined
    }
  }

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message)
    }

    return String(error)
  }

  const setValue = (value: string) => {
    internalValue.value = value
    emit('update:modelValue', value)
  }

  const getValue = () => internalValue.value

  watch(
    () => props.modelValue,
    (newValue) => {
      internalValue.value = newValue
    },
  )

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
