import { useEffect, useState } from 'react'

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import DateField from '../../../components/ui/DateField.jsx'
import { firstError } from '../../../utils/apiError.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'

import { useCreateDriver, useUpdateDriver } from './utils/drivers.queries.js'

dayjs.extend(customParseFormat)

const emptyForm = {
    fullName: '',
    passportNumber: '',
    passportIssueDate: '',
    passportEmittedBy: '',
    phone: '',
}

const emptyToNull = (value) => (value?.trim() ? value.trim() : null)

export default function DriverDialog({ open, mode = 'create', carrierId, initialData = null, onClose, onSaved }) {
    const createDriver = useCreateDriver()
    const updateDriver = useUpdateDriver()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')

    const isEdit = mode === 'edit'

    const saving = createDriver.isPending || updateDriver.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setError('')
        setPhoneError('')

        if (isEdit && initialData) {
            setForm({
                fullName: String(initialData.fullName ?? initialData.full_name ?? ''),
                passportNumber: String(initialData.passportNumber ?? initialData.passport_number ?? ''),
                passportIssueDate: String(initialData.passportIssueDate ?? initialData.passport_issue_date ?? ''),
                passportEmittedBy: String(initialData.passportEmittedBy ?? initialData.passport_emitted_by ?? ''),
                phone: String(initialData.phone ?? ''),
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

        setPhoneError(currentPhoneError)

        if (currentPhoneError) {
            return
        }

        const payload = {
            carrier: Number(carrierId),
            fullName: form.fullName.trim(),
            passportNumber: emptyToNull(form.passportNumber),
            passport_issue_date: form.passportIssueDate
                ? dayjs(form.passportIssueDate, 'DD.MM.YYYY', true).format('YYYY-MM-DD')
                : null,
            passportEmittedBy: emptyToNull(form.passportEmittedBy),
            phone: emptyToNull(form.phone),
        }

        try {
            let savedDriver

            if (isEdit) {
                savedDriver = await updateDriver.mutateAsync({
                    id: initialData.id,
                    payload,
                })
            } else {
                savedDriver = await createDriver.mutateAsync({
                    carrierId,
                    payload,
                })
            }

            await onSaved?.(savedDriver)
        } catch (err) {
            setError(firstError(err))
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Редактировать водителя' : 'Добавить водителя'}</DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 1 }}>
                <Stack component="form" id="driver-dialog-form" onSubmit={handleSubmit} spacing={1.5} sx={{ mt: 0.5 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        size="small"
                        label="Полное имя"
                        value={form.fullName}
                        onChange={onChange('fullName')}
                        required
                        fullWidth
                        autoFocus
                    />

                    <TextField
                        size="small"
                        label="Номер паспорта"
                        value={form.passportNumber}
                        onChange={onChange('passportNumber')}
                        fullWidth
                    />

                    <DateField
                        label="Дата выдачи паспорта"
                        value={form.passportIssueDate}
                        onChange={(value) =>
                            setForm((prev) => ({
                                ...prev,
                                passportIssueDate: value,
                            }))
                        }
                    />

                    <TextField
                        size="small"
                        label="Кем выдан"
                        value={form.passportEmittedBy}
                        onChange={onChange('passportEmittedBy')}
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

                <Button type="submit" form="driver-dialog-form" variant="contained" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
