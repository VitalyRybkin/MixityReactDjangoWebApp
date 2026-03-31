import { useCallback, useEffect } from 'react'

export const useEntityForm = ({
    isEdit,
    entity,
    emptyForm,
    setError,
    loadError,
    setForm,
    resetErrors,
    mapEntityToForm,
    validators = {},
    submitAction,
    getLoadErrorMessage = (error) => error?.response?.data?.detail || 'Ошибка загрузки данных',
    getSubmitErrorMessage,
}) => {
    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            resetErrors?.()
            return
        }

        if (entity) {
            setForm(mapEntityToForm(entity))
            resetErrors?.()
        }
    }, [entity, isEdit, emptyForm, mapEntityToForm, resetErrors, setForm])

    useEffect(() => {
        if (loadError) {
            setError(getLoadErrorMessage(loadError))
        }
    }, [getLoadErrorMessage, loadError, setError])

    const onChange = useCallback(
        (field) => (e) => {
            const config = validators[field]
            let value = e.target.value

            if (config?.normalize) {
                value = config.normalize(value)
            }

            if (config?.validate && config?.setError) {
                config.setError(config.validate(value))
            }

            setForm((prev) => ({ ...prev, [field]: value }))
        },
        [setForm, validators],
    )

    const validateBeforeSubmit = useCallback(
        (form) => {
            let hasErrors = false

            Object.entries(validators).forEach(([field, config]) => {
                if (!config?.validate || !config?.setError) return

                const error = config.validate(form[field])
                config.setError(error)

                if (error) {
                    hasErrors = true
                }
            })

            return !hasErrors
        },
        [validators],
    )

    const onSubmit = useCallback(
        async (e, form) => {
            e.preventDefault()
            setError('')

            if (!validateBeforeSubmit(form)) {
                return
            }

            try {
                await submitAction(form)
            } catch (error) {
                setError(getSubmitErrorMessage(error))
            }
        },
        [getSubmitErrorMessage, setError, submitAction, validateBeforeSubmit],
    )

    return {
        onChange,
        onSubmit,
        validateBeforeSubmit,
    }
}
