import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { firstError } from '../utils/apiError.js'
import { normalizeEmailInput, validateEmailValue } from '../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../utils/phone.js'

export const useFormLogic = ({
    isEdit,
    id,
    emptyForm,
    updateMutation,
    createMutation,
    redirectPath,
    toPayload = (form) => form,
    validate = () => true,
    onSuccess = () => {},
}) => {
    const navigate = useNavigate()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const onChange = (field) => (e) => {
        let value = e?.target ? e.target.value : e

        if (field === 'phone') {
            value = normalizePhoneInput(value)
            setPhoneError(validatePhoneValue(value))
        }

        if (field === 'email') {
            value = normalizeEmailInput(value)
            setEmailError(validateEmailValue(value))
        }

        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const validateBeforeSubmit = () => {
        const hasPhoneField = Object.prototype.hasOwnProperty.call(form, 'phone')
        const hasEmailField = Object.prototype.hasOwnProperty.call(form, 'email')

        const phoneErr = hasPhoneField ? validatePhoneValue(form.phone) : ''
        const emailErr = hasEmailField ? validateEmailValue(form.email) : ''

        setPhoneError(phoneErr)
        setEmailError(emailErr)

        if (phoneErr || emailErr) return false

        return validate(form)
    }

    const onSubmit = async (e) => {
        if (e) e.preventDefault()
        setError('')

        if (!validateBeforeSubmit()) return

        const payload = toPayload(form)

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id, payload })
            } else {
                await createMutation.mutateAsync(payload)
            }

            onSuccess()
            navigate(redirectPath)
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    return {
        form,
        setForm,
        error,
        setError,
        phoneError,
        setPhoneError,
        emailError,
        setEmailError,
        onChange,
        onSubmit,
    }
}
