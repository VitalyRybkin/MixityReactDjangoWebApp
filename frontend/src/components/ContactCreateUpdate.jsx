import { useEffect, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import api from '../api'
import {
    PHONE_ERROR_MESSAGE,
    buildPhonePayload,
    emptyPhone,
    normalizePhoneInput,
    validatePhoneList,
    validatePhoneValue,
} from '../utils/phone'

const safeStr = (v) => v ?? ''

export default function ContactCreateUpdate({ open, mode, ownerType, ownerId, initialData, onClose, onSaved }) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [phoneErrors, setPhoneErrors] = useState([''])

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phoneNumbers: [emptyPhone()],
    })

    useEffect(() => {
        if (!open) return

        setError('')
        setSaving(false)

        if (mode === 'edit' && initialData) {
            const phones = (initialData.phoneNumbers?.length ? initialData.phoneNumbers : [emptyPhone()]).map((p) => ({
                phoneNumber: safeStr(p.phoneNumber),
            }))

            setForm({
                firstName: safeStr(initialData.firstName),
                lastName: safeStr(initialData.lastName),
                position: safeStr(initialData.position),
                email: safeStr(initialData.email),
                phoneNumbers: phones,
            })
            setPhoneErrors(phones.map(() => ''))
        } else {
            setForm({
                firstName: '',
                lastName: '',
                position: '',
                email: '',
                phoneNumbers: [emptyPhone()],
            })
            setPhoneErrors([''])
        }
    }, [open, mode, initialData])

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const addPhone = () => {
        setForm((prev) => ({
            ...prev,
            phoneNumbers: [...prev.phoneNumbers, emptyPhone()],
        }))
        setPhoneErrors((prev) => [...prev, ''])
    }

    const removePhone = (idx) => {
        setForm((prev) => ({
            ...prev,
            phoneNumbers:
                prev.phoneNumbers.length === 1 ? [emptyPhone()] : prev.phoneNumbers.filter((_, i) => i !== idx),
        }))

        setPhoneErrors((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx)))
    }

    const changePhone = (idx) => (e) => {
        const value = normalizePhoneInput(e.target.value)

        setForm((prev) => ({
            ...prev,
            phoneNumbers: prev.phoneNumbers.map((phone, i) => (i === idx ? { ...phone, phoneNumber: value } : phone)),
        }))

        setPhoneErrors((prev) => prev.map((err, i) => (i === idx ? validatePhoneValue(value) : err)))
    }

    const validatePhonesBeforeSubmit = () => {
        const errors = validatePhoneList(form.phoneNumbers)
        setPhoneErrors(errors)
        return errors.every((err) => !err)
    }

    const buildPayload = () => {
        const id = Number(ownerId)

        const owner = {
            warehouse: ownerType === 'warehouse' ? id : null,
            carrier: ownerType === 'carrier' ? id : null,
            client: ownerType === 'client' ? id : null,
            customer: ownerType === 'customer' ? id : null,
        }

        return {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || '',
            position: form.position.trim() || null,
            email: form.email.trim() || null,
            phoneNumbers: buildPhonePayload(form.phoneNumbers),
            ...owner,
        }
    }

    const submit = async (e) => {
        if (e) e.preventDefault()

        setSaving(true)
        setError('')

        if (!validatePhonesBeforeSubmit()) {
            setSaving(false)
            return
        }

        try {
            if (mode === 'create') {
                await api.post('/api/contacts/', buildPayload())
            } else {
                const editPayload = { ...buildPayload() }
                delete editPayload.carrier
                delete editPayload.warehouse

                await api.patch(`/api/contacts/${initialData.id}/`, editPayload)
            }

            await onSaved()
        } catch (err) {
            const data = err?.response?.data

            if (Array.isArray(data)) {
                setError(data[0] || 'Ошибка сохранения')
            } else if (typeof data === 'string') {
                setError(data)
            } else if (data && typeof data === 'object') {
                const firstKey = Object.keys(data)[0]
                const val = data[firstKey]

                const msg = firstKey
                    ? `${firstKey}: ${Array.isArray(val) ? val[0] : typeof val === 'string' ? val : 'Invalid'}`
                    : 'Ошибка сохранения'

                setError(msg)
            } else {
                setError(err?.message || 'Ошибка сохранения')
            }
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{mode === 'create' ? 'Добавить контакт' : 'Редактировать контакт'}</DialogTitle>

            <DialogContent>
                <Stack component="form" id="contact-form" onSubmit={submit} spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField label="Имя" value={form.firstName} onChange={onChange('firstName')} fullWidth />
                    <TextField label="Фамилия" value={form.lastName} onChange={onChange('lastName')} fullWidth />
                    <TextField label="Должность" value={form.position} onChange={onChange('position')} fullWidth />
                    <TextField label="Email" value={form.email} onChange={onChange('email')} fullWidth />

                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1">Телефоны</Typography>
                            <Button
                                type="button"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addPhone}
                                disabled={saving}
                            >
                                Добавить
                            </Button>
                        </Stack>

                        <Stack spacing={1}>
                            {form.phoneNumbers.map((p, idx) => (
                                <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label={`Телефон ${idx + 1}`}
                                        value={p.phoneNumber}
                                        onChange={changePhone(idx)}
                                        fullWidth
                                        error={Boolean(phoneErrors[idx])}
                                        helperText={
                                            phoneErrors[idx] ||
                                            `Формат: ${PHONE_ERROR_MESSAGE.slice(-12) === '+79991234567' ? '+79991234567' : PHONE_ERROR_MESSAGE}`
                                        }
                                        placeholder="+79991234567"
                                    />
                                    <IconButton type="button" onClick={() => removePhone(idx)} disabled={saving}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Отмена
                </Button>
                <Button type="submit" form="contact-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
