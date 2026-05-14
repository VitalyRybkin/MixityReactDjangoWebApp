import React, { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'

import api from '../../api.js'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'

import { warehouseApiPaths } from './utils/warehouseApiPaths.js'

export default function WarehouseMapUploadPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const warehouse = useLocation().state?.warehouse

    const [file, setFile] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()

        if (!file) {
            setError('Выберите файл')
            return
        }

        setSaving(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('directions', file)

            await api.patch(warehouseApiPaths.map(), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            navigate(`/warehouses/${id}`)
        } catch (e) {
            setError(e?.response?.data?.directions?.[0] || 'Не удалось загрузить файл')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={{ id: warehouse }} />
            <Card variant="outlined">
                <CardContent>
                    <Stack component="form" spacing={2} onSubmit={onSubmit}>
                        <Typography variant="h6">Загрузка схемы проезда</Typography>

                        {error && <Alert severity="error">{error}</Alert>}

                        <Button variant="outlined" component="label">
                            Выбрать файл
                            <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </Button>

                        {file && <Typography variant="body2">Файл: {file.name}</Typography>}

                        <Stack direction="row" spacing={1}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Загрузка...' : 'Сохранить'}
                            </Button>
                            <Button variant="text" onClick={() => navigate(`/warehouses/${id}`)}>
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    )
}
