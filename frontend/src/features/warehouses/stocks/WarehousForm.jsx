import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { firstError } from '../../../utils/apiError.js'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import api from '../../../api.js'

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

    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState(emptyForm)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            setLoading(false)
            return
        }

        let alive = true
        ;(async () => {
            try {
                setLoading(true)
                const res = await api.get(`/api/stock/${id}/`)
                if (!alive) return
                setForm({
                    name: res.data.name ?? '',
                    organization: res.data.organization ?? '',
                    address: res.data.address ?? '',
                    phoneNumber: res.data.phoneNumber ?? '',
                    email: res.data.email ?? '',
                    descriptions: res.data.descriptions ?? '',
                })
            } catch (e) {
                if (!alive) return
                setError(e?.response?.data?.detail || 'Ошибка загрузки данных')
            } finally {
                if (alive) setLoading(false)
            }
        })()

        return () => {
            alive = false
        }
    }, [id, isEdit])

    const onChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const onSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        try {
            if (isEdit) {
                await api.patch(`/api/stock/${id}/`, form)
            } else {
                await api.post(`/api/stock/`, form)
            }
            navigate('/warehouses')
        } catch (e2) {
            setError(firstError(e2))
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <CircularProgress />

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
                        <TextField label="Телефон" value={form.phoneNumber} onChange={onChange('phoneNumber')} fullWidth />
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
                            <Button variant="outlined" onClick={() => navigate(-1)} disabled={saving}>
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    )
}
