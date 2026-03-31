import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Box, CircularProgress } from '@mui/material'

import { firstError } from '../../utils/apiError.js'
import { normalizeEmailInput, validateEmailValue } from '../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../utils/phone.js'

import { useCreateClient, useGetClient, useUpdateClient } from './clients.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
}

export default function ClientFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const location = useLocation()
    const backPath = location.state?.from || '/'

    const { data: client, isPending: loadingClient, error: loadError } = useGetClient(id)
    const createClient = useCreateClient()
    const updateClient = useUpdateClient()

    const saving = createClient.isPending || updateClient.isPending

    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setPhoneError('')
            return
        }

        if (client) {
            setForm({
                name: client.name ?? '',
                organization: client.organization ?? '',
                address: client.address ?? '',
                phone: client.phone ?? '',
                email: client.email ?? '',
            })
            setPhoneError('')
        }
    }, [client, error])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const onChange = (field) => (e) => {
        let value = e.target.value

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
        const phoneErr = validatePhoneValue(form.phone)

        const emailErr = validateEmailValue(form.email)
        setPhoneError(phoneErr)

        setEmailError(emailErr)
        return !phoneErr && !emailErr
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!validateBeforeSubmit()) {
            return
        }

        try {
            if (isEdit) {
                await updateClient.mutateAsync({ id, payload: form })
            } else {
                await createClient.mutateAsync(form)
            }
            navigate('/carriers')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    if (isEdit && loadingClient) return <CircularProgress />

    return <Box sx={{ p: 3, maxWidth: 700 }}></Box>
}
