import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../../utils/apiError.js'
import { EMAIL_HINT, normalizeEmailInput, validateEmailValue } from '../../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'
import { useCreateCustomer } from '../../customers/utils/customers.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
}

export default function CustomerCreateDialog({ open, onClose, onSaved }) {
    const createCustomer = useCreateCustomer()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const saving = createCustomer.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setForm(emptyForm)
        setError('')
        setPhoneError('')
        setEmailError('')
    }, [open])

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
            const customer = await createCustomer.mutateAsync(form)
            await onSaved(customer)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>Добавить заказчика</DialogTitle>

            <DialogContent>
                <Stack component="form" id="customer-create-form" onSubmit={handleSubmit} spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField label="Наименование" value={form.name} onChange={onChange('name')} fullWidth required />

                    <TextField
                        label="Наименование заказчика"
                        value={form.organization}
                        onChange={onChange('organization')}
                        fullWidth
                    />

                    <TextField label="Адрес" value={form.address} onChange={onChange('address')} fullWidth />

                    <TextField
                        label="Телефон"
                        value={form.phone}
                        onChange={onChange('phone')}
                        error={Boolean(phoneError)}
                        helperText={phoneError || 'Формат: +79991234567'}
                        placeholder="+79991234567"
                        fullWidth
                    />

                    <TextField
                        label="Эл. почта"
                        value={form.email}
                        onChange={onChange('email')}
                        error={Boolean(emailError)}
                        helperText={emailError || EMAIL_HINT}
                        placeholder="name@example.com"
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button type="button" onClick={onClose} disabled={saving}>
                    Отмена
                </Button>

                <Button type="submit" form="customer-create-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
