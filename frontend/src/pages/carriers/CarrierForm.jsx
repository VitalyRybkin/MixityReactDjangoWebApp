import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import { firstError } from '../../utils/apiError'
import { useCarrier, useCreateCarrier, useUpdateCarrier } from '../../features/logistic/carriers/carrier.queries.js'

const emptyForm = {
    name: '',
    fullName: '',
    address: '',
    phone: '',
    email: '',
    description: '',
}

export default function CarrierFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: carrier, isPending: loadingCarrier, error: loadError } = useCarrier(id)
    const createCarrier = useCreateCarrier()
    const updateCarrier = useUpdateCarrier()

    const [error, setError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (carrier) {
            setForm({
                name: carrier.name ?? '',
                fullName: carrier.fullName ?? '',
                address: carrier.address ?? '',
                phone: carrier.phone ?? '',
                email: carrier.email ?? '',
                description: carrier.description ?? '',
            })
        }
    }, [carrier, isEdit])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const saving = createCarrier.isPending || updateCarrier.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateCarrier.mutateAsync({ id, payload: form })
            } else {
                await createCarrier.mutateAsync(form)
            }
            navigate('/carriers')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    if (isEdit && loadingCarrier) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.fullName || ''}` : 'Создать грузоперевозчика'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <TextField label="Наименование" value={form.name} onChange={onChange('name')} fullWidth />
                        <TextField
                            label="Полное наименование"
                            value={form.fullName}
                            onChange={onChange('fullName')}
                            fullWidth
                        />
                        <TextField label="Адрес" value={form.address} onChange={onChange('address')} fullWidth />
                        <TextField label="Телефон" value={form.phone} onChange={onChange('phone')} fullWidth />
                        <TextField label="Эл. почта" value={form.email} onChange={onChange('email')} fullWidth />
                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/carriers')} disabled={saving}>
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}