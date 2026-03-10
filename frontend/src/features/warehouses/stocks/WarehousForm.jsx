import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import { firstError } from '../../../utils/apiError.js'
import {
    useCreateWarehouse,
    useUpdateWarehouse,
    useWarehouse,
} from './stocks.queries.js'

const emptyForm = {
    name: '',
    organization: '',
    address: '',
    phoneNumber: '',
    email: '',
    descriptions: '',
}

export default function WarehouseFormPage() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const { data: warehouse, isPending: loadingWarehouse, error: loadError } = useWarehouse(id)
    const createWarehouse = useCreateWarehouse()
    const updateWarehouse = useUpdateWarehouse()

    const [error, setError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (warehouse) {
            setForm({
                name: warehouse.name ?? '',
                organization: warehouse.organization ?? '',
                address: warehouse.address ?? '',
                phoneNumber: warehouse.phoneNumber ?? '',
                email: warehouse.email ?? '',
                descriptions: warehouse.descriptions ?? '',
            })
        }
    }, [warehouse, isEdit])

    useEffect(() => {
        if (loadError) {
            setError(loadError?.response?.data?.detail || 'Ошибка загрузки данных')
        }
    }, [loadError])

    const onChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }

    const saving = createWarehouse.isPending || updateWarehouse.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateWarehouse.mutateAsync({ id, payload: form })
            } else {
                await createWarehouse.mutateAsync(form)
            }
            navigate('/warehouses')
        } catch (e2) {
            setError(firstError(e2))
        }
    }

    if (isEdit && loadingWarehouse) return <CircularProgress />

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? `Редактировать ${form.organization || ''}` : 'Создать склад'}
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
                            label="Наименование организации"
                            value={form.organization}
                            onChange={onChange('organization')}
                            fullWidth
                        />
                        <TextField label="Адрес" value={form.address} onChange={onChange('address')} fullWidth />
                        <TextField
                            label="Телефон"
                            value={form.phoneNumber}
                            onChange={onChange('phoneNumber')}
                            fullWidth
                        />
                        <TextField label="Эл. почта" value={form.email} onChange={onChange('email')} fullWidth />
                        <TextField
                            label="Примечание"
                            value={form.descriptions}
                            onChange={onChange('descriptions')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button variant="outlined" onClick={() => navigate('/warehouses')} disabled={saving}>
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}