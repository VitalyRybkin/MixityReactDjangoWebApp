import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import api from '../../api.js'

const emptyForm = {
    name: '',
    fullName: '',
    address: '',
    phone: '',
    email: '',
    description: '',
}

const firstError = (e) => {
    const data = e?.response?.data
    if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        return firstKey
            ? `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`
            : 'Ошибка сохранения!'
    }
    return data?.detail || 'Ошибка сохранения!'
}

export default function CarrierFormPage() {
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
                const res = await api.get(`/api/logistic/carriers/${id}/`)
                if (!alive) return
                setForm({
                    name: res.data.name ?? '',
                    fullName: res.data.fullName ?? '',
                    address: res.data.address ?? '',
                    phone: res.data.phone ?? '',
                    email: res.data.email ?? '',
                    description: res.data.description ?? '',
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
                await api.patch(`/api/logistic/carriers/${id}/`, form)
            } else {
                await api.post(`/api/logistic/carriers/`, form)
            }
            navigate('/carriers')
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
