import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../utils/apiError.js'
import { EMAIL_HINT, normalizeEmailInput, validateEmailValue } from '../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../utils/phone.js'

import { useCreateCustomer, useUpdateCustomer } from './utils/customers.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
}

export default function CustomerDialog({ open, mode = 'create', initialData = null, onClose, onSaved }) {
    const createCustomer = useCreateCustomer()
    const updateCustomer = useUpdateCustomer()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const isEdit = mode === 'edit'
    const saving = createCustomer.isPending || updateCustomer.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setError('')
        setPhoneError('')
        setEmailError('')

        if (isEdit && initialData) {
            setForm({
                name: initialData.name ?? '',
                organization: initialData.organization ?? '',
                address: initialData.address ?? '',
                phone: initialData.phone ?? '',
                email: initialData.email ?? '',
            })

            return
        }

        setForm(emptyForm)
    }, [open, isEdit, initialData])

    const onChange = (field) => (event) => {
        let value = event.target.value

        if (field === 'phone') {
            value = normalizePhoneInput(value)
            setPhoneError(validatePhoneValue(value))
        }

        if (field === 'email') {
            value = normalizeEmailInput(value)
            setEmailError(validateEmailValue(value))
        }

        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        setError('')

        const currentPhoneError = validatePhoneValue(form.phone)

        const currentEmailError = validateEmailValue(form.email)

        setPhoneError(currentPhoneError)
        setEmailError(currentEmailError)

        if (currentPhoneError || currentEmailError) {
            return
        }

        try {
            let savedCustomer

            if (isEdit) {
                savedCustomer = await updateCustomer.mutateAsync({
                    id: initialData.id,
                    payload: form,
                })
            } else {
                savedCustomer = await createCustomer.mutateAsync(form)
            }

            await onSaved?.(savedCustomer)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Редактировать заказчика' : 'Добавить заказчика'}</DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 1 }}>
                <Stack
                    component="form"
                    id="customer-dialog-form"
                    onSubmit={handleSubmit}
                    spacing={1.5}
                    sx={{ mt: 0.5 }}
                >
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        size="small"
                        label="Наименование"
                        value={form.name}
                        onChange={onChange('name')}
                        required
                        fullWidth
                        autoFocus
                    />

                    <TextField
                        size="small"
                        label="Наименование заказчика"
                        value={form.organization}
                        onChange={onChange('organization')}
                        fullWidth
                    />

                    <TextField
                        size="small"
                        label="Адрес"
                        value={form.address}
                        onChange={onChange('address')}
                        fullWidth
                    />

                    <TextField
                        size="small"
                        label="Телефон"
                        value={form.phone}
                        onChange={onChange('phone')}
                        error={Boolean(phoneError)}
                        helperText={phoneError || 'Формат: +79991234567'}
                        placeholder="+79991234567"
                        fullWidth
                        slotProps={{
                            formHelperText: {
                                sx: { mt: 0.5 },
                            },
                        }}
                    />

                    <TextField
                        size="small"
                        label="Эл. почта"
                        value={form.email}
                        onChange={onChange('email')}
                        error={Boolean(emailError)}
                        helperText={emailError || EMAIL_HINT}
                        placeholder="name@example.com"
                        fullWidth
                        slotProps={{
                            formHelperText: {
                                sx: { mt: 0.5 },
                            },
                        }}
                    />
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 3,
                    pt: 1,
                }}
            >
                <Button type="button" onClick={onClose} disabled={saving}>
                    Отмена
                </Button>

                <Button type="submit" form="customer-dialog-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
