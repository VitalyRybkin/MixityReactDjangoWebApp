import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert, Box, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'

import FormActions from '../../components/ui/FormActions.jsx'
import { entityFormSx as sx } from '../../styles/entityForm.styles.js'
import { firstError } from '../../utils/apiError.js'

import {
    useCreateCustomerObject,
    useGetCustomerObject,
    useUpdateCustomerObject,
} from './utils/customers.queries.js'

const emptyForm = {
    name: '',
    address: '',
}

export default function ConstructionObjectFormPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { id, objectId } = useParams()

    const isEdit = Boolean(objectId)
    const entity = location.state?.entity

    const {
        data: constructionObject,
        isLoading: loadingObject,
    } = useGetCustomerObject(id, objectId)

    const createMutation = useCreateCustomerObject()
    const updateMutation = useUpdateCustomerObject()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isEdit && constructionObject) {
            setForm({
                name: constructionObject.name || '',
                address: constructionObject.address || '',
            })
        } else {
            setForm(emptyForm)
        }
    }, [constructionObject, isEdit])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const saving = createMutation.isPending || updateMutation.isPending

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({
                    id,
                    objectId,
                    payload: form,
                })
            } else {
                await createMutation.mutateAsync({
                    id,
                    payload: form,
                })
            }

            navigate(`/customers/${id}/construction_objects/`, {
                state: entity ? { entity } : undefined,
            })
        } catch (err) {
            setError(firstError(err))
        }
    }

    if (isEdit && loadingObject) {
        return (
            <Box sx={sx.loading}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={sx.page}>
            <Paper sx={sx.paper}>
                <Typography variant="h5" sx={sx.title}>
                    {isEdit ? 'Редактировать объект' : 'Добавить объект'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={sx.error}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit} sx={sx.form}>
                    <Stack spacing={2}>
                        <TextField
                            label="Наименование"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Адрес"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions
                            saving={saving}
                            onCancel={() =>
                                navigate(`/customers/${id}/construction_objects/`, {
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