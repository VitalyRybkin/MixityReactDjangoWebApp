import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import AddIcon from '@mui/icons-material/Add'
import {
    Alert,
    Box,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../../components/AppBreadcrumbs.jsx'
import FormActions from '../../../components/ui/FormActions.jsx'
import { firstError } from '../../../utils/apiError.js'

import TruckCapacityCreateDialog from './TruckCapacityDialogForm.jsx'
import TruckTypeCreateDialog from './TruckTypeDialogForm.jsx'
import {
    useCreateTruck,
    useGetTruck,
    useGetTruckCapacities,
    useGetTruckTypes,
    useUpdateTruck,
} from './trucks.queries.js'

const emptyForm = {
    truckType: '',
    capacity: '',
    licensePlate: '',
    description: '',
}

const normalizePlate = (value) => value.toUpperCase().replace(/\s|-/g, '')

export default function TruckFormPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { carrierId, truckId } = useParams()

    const isEdit = Boolean(truckId)
    const entity = location.state?.entity

    const { data: truck, isPending: loadingTruck } = useGetTruck(truckId)
    const { data: truckTypes = [], isPending: loadingTypes, refetch: refetchTruckTypes } = useGetTruckTypes()
    const { data: capacities = [], isPending: loadingCapacities, refetch: refetchCapacities } = useGetTruckCapacities()

    const createTruck = useCreateTruck()
    const updateTruck = useUpdateTruck()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const [typeDialogOpen, setTypeDialogOpen] = useState(false)
    const [capacityDialogOpen, setCapacityDialogOpen] = useState(false)

    useEffect(() => {
        if (!isEdit) {
            setForm(emptyForm)
            return
        }

        if (truck) {
            setForm({
                truckType: String(truck.truckType?.id ?? truck.truck_type ?? ''),
                capacity: String(truck.capacity?.id ?? truck.capacity_id ?? truck.capacity ?? ''),
                licensePlate: truck.licensePlate ?? truck.license_plate ?? '',
                description: truck.description ?? '',
            })
        }
    }, [truck, isEdit])

    const saving = createTruck.isPending || updateTruck.isPending
    const loading = (isEdit && loadingTruck) || loadingTypes || loadingCapacities

    const onChange = (field) => (e) => {
        const value = field === 'licensePlate' ? normalizePlate(e.target.value) : e.target.value
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const payload = useMemo(
        () => ({
            carrier: Number(carrierId),
            truckType: Number(form.truckType),
            capacity: Number(form.capacity),
            licensePlate: normalizePlate(form.licensePlate),
            description: form.description,
        }),
        [carrierId, form],
    )

    const onSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isEdit) {
                await updateTruck.mutateAsync({ id: truckId, payload })
            } else {
                await createTruck.mutateAsync({ carrierId, payload })
            }

            navigate(`/carriers/${carrierId}/trucks`, {
                state: entity ? { entity } : undefined,
            })
        } catch (err) {
            setError(firstError(err))
        }
    }

    if (loading) {
        return (
            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3, maxWidth: 700 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {isEdit ? 'Редактировать автотранспорт' : 'Добавить автотранспорт'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <FormControl fullWidth required>
                                <InputLabel id="truck-type-label">Тип</InputLabel>
                                <Select
                                    labelId="truck-type-label"
                                    label="Тип"
                                    value={form.truckType}
                                    onChange={onChange('truckType')}
                                    variant="outlined"
                                >
                                    {truckTypes.map((item) => (
                                        <MenuItem key={item.id} value={String(item.id)}>
                                            {item.truckType}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Tooltip title="Добавить тип">
                                <IconButton onClick={() => setTypeDialogOpen(true)} sx={{ mt: 1 }}>
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <FormControl fullWidth required>
                                <InputLabel id="capacity-label">Грузоподъемность</InputLabel>
                                <Select
                                    labelId="capacity-label"
                                    label="Грузоподъемность"
                                    value={form.capacity}
                                    onChange={onChange('capacity')}
                                    variant="outlined"
                                >
                                    {capacities.map((item) => (
                                        <MenuItem key={item.id} value={String(item.id)}>
                                            {item.capacity}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Tooltip title="Добавить грузоподъемность">
                                <IconButton onClick={() => setCapacityDialogOpen(true)} sx={{ mt: 1 }}>
                                    <AddIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        <TextField
                            label="Госномер"
                            value={form.licensePlate}
                            onChange={onChange('licensePlate')}
                            fullWidth
                            required
                        />

                        <TextField
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <FormActions
                            saving={saving}
                            onCancel={() =>
                                navigate(`/carriers/${carrierId}/trucks`, {
                                    state: entity ? { entity } : undefined,
                                })
                            }
                        />
                    </Stack>
                </Box>
            </Paper>

            <TruckTypeCreateDialog
                open={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                onCreated={async (created) => {
                    await refetchTruckTypes()
                    setForm((prev) => ({ ...prev, truckType: String(created.id) }))
                }}
            />

            <TruckCapacityCreateDialog
                open={capacityDialogOpen}
                onClose={() => setCapacityDialogOpen(false)}
                onCreated={async (created) => {
                    await refetchCapacities()
                    setForm((prev) => ({ ...prev, capacity: String(created.id) }))
                }}
            />
        </Box>
    )
}
