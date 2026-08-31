import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import DateField from '../../../components/ui/DateField.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { entityFormSx as sx } from '../../../styles/entityForm.styles.js'
import { firstError } from '../../../utils/apiError.js'
import { normalizePhoneInput, validatePhoneValue } from '../../../utils/phone.js'

import { useCreateDriver, useGetDriver, useUpdateDriver } from './utils/drivers.queries.js'

dayjs.extend(customParseFormat)

const emptyForm = {
    fullName: '',
    passportNumber: '',
    passportIssueDate: '',
    passportEmittedBy: '',
    phone: '',
}

const emptyToNull = (v) => (v?.trim() ? v.trim() : null)

export default function DriverFormPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { carrierId, driverId } = useParams()

    const isEdit = Boolean(driverId)
    const entity = location.state?.entity

    const { data: driver, isPending: loadingDriver, error: loadError } = useGetDriver(driverId)

    const createDriver = useCreateDriver()
    const updateDriver = useUpdateDriver()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [phoneError, setPhoneError] = useState('')

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (driver) {
            setForm({
                fullName: String(driver.fullName ?? driver.full_name ?? ''),
                passportNumber: String(driver.passportNumber ?? driver.passport_number ?? ''),
                passportIssueDate: String(driver.passportIssueDate ?? driver.passport_issue_date ?? ''),
                passportEmittedBy: String(driver.passportEmittedBy ?? driver.passport_emitted_by ?? ''),
                phone: String(driver.phone ?? ''),
            })
        }
    }, [driver, isEdit])

    const saving = createDriver.isPending || updateDriver.isPending
    const loading = isEdit && loadingDriver

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

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
            if (isEdit) {
                await updateDriver.mutateAsync({ id: driverId, payload })
            } else {
                await createDriver.mutateAsync({ carrierId, payload })
            }

            navigate(`/carriers/${carrierId}/drivers`, {
                state: entity ? { entity } : undefined,
            })
        } catch (err) {
            setError(firstError(err))
        }
    }

    const onChange = (field) => (e) => {
        let value = e.target.value
        if (field === 'phone') {
            value = normalizePhoneInput(value)
            setPhoneError(validatePhoneValue(value))
        }
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    if (loading) {
        return (
            <Box sx={sx.loading}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Paper sx={sx.paper}>
                <Typography variant="h5" sx={sx.title}>
                    {isEdit ? 'Редактировать водителя' : 'Добавить водителя'}
                </Typography>

                {loadError && (
                    <Alert severity="error" sx={sx.error}>
                        {firstError(loadError)}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={sx.error}>
                        {error}
                    </Alert>
                )}

                <Box component="form" sx={sx.form} onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Полное имя"
                            value={form.fullName}
                            onChange={onChange('fullName')}
                            fullWidth
                            required
                        />

                        <TextField
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
                            label="Кем выдан"
                            value={form.passportEmittedBy}
                            onChange={onChange('passportEmittedBy')}
                            fullWidth
                        />

                        <TextField
                            label="Телефон"
                            value={form.phone}
                            onChange={onChange('phone')}
                            fullWidth
                            error={Boolean(phoneError)}
                            helperText={phoneError || 'Формат: +79991234567'}
                            placeholder="+79991234567"
                        />

                        <FormActions
                            saving={saving}
                            onCancel={() =>
                                navigate(`/carriers/${carrierId}/drivers`, {
                                    state: entity ? { entity } : undefined,
                                })
                            }
                        />
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
