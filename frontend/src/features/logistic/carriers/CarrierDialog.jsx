import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import { firstError } from '../../../utils/apiError.js'
import { EMAIL_HINT, normalizeEmailInput, validateEmailValue } from '../../../utils/email.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'

import { useCreateCarrier, useUpdateCarrier } from './utils/carriers.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phone: '',
    email: '',
    description: '',
}

export default function CarrierDialog({ open, mode = 'create', initialData = null, onClose, onSaved }) {
    const createCarrier = useCreateCarrier()
    const updateCarrier = useUpdateCarrier()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [emailError, setEmailError] = useState('')

    const isEdit = mode === 'edit'
    const saving = createCarrier.isPending || updateCarrier.isPending

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
                description: initialData.description ?? '',
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

    const validateBeforeSubmit = () => {
        const phoneErr = validatePhoneValue(form.phone)
        const emailErr = validateEmailValue(form.email)

        setPhoneError(phoneErr)
        setEmailError(emailErr)

        return !phoneErr && !emailErr
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        setError('')

        if (!validateBeforeSubmit()) {
            return
        }

        try {
            let savedCarrier

            if (isEdit) {
                savedCarrier = await updateCarrier.mutateAsync({
                    id: initialData.id,
                    payload: form,
                })
            } else {
                savedCarrier = await createCarrier.mutateAsync(form)
            }

            await onSaved?.(savedCarrier)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {isEdit ? 'Редактировать транспортную компанию' : 'Добавить транспортную компанию'}
            </DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 1 }}>
                <Stack component="form" id="carrier-dialog-form" onSubmit={handleSubmit} spacing={1.5} sx={{ mt: 0.5 }}>
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
                        label="Полное наименование"
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

                    <TextField
                        size="small"
                        label="Примечание"
                        value={form.description}
                        onChange={onChange('description')}
                        multiline
                        minRows={3}
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                <Button onClick={onClose} disabled={saving}>
                    Отмена
                </Button>

                <Button type="submit" form="carrier-dialog-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
