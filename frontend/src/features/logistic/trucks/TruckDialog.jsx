import { useEffect, useState } from 'react'

import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import { firstError } from '../../../utils/apiError.js'

import TruckCapacityCreateDialog from './TruckCapacityDialogForm.jsx'
import TruckTypeCreateDialog from './TruckTypeDialogForm.jsx'
import { useCreateTruck, useGetTruckCapacities, useGetTruckTypes, useUpdateTruck } from './utils/trucks.queries.js'

const emptyForm = {
    truckType: '',
    capacity: '',
    licensePlate: '',
    description: '',
}

const normalizePlate = (value) => value.toUpperCase().replace(/\s|-/g, '')

export default function TruckDialog({ open, mode = 'create', carrierId, initialData = null, onClose, onSaved }) {
    const createTruck = useCreateTruck()
    const updateTruck = useUpdateTruck()

    const { data: truckTypes = [], isPending: loadingTypes, refetch: refetchTruckTypes } = useGetTruckTypes()

    const { data: capacities = [], isPending: loadingCapacities, refetch: refetchCapacities } = useGetTruckCapacities()

    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const [typeDialogOpen, setTypeDialogOpen] = useState(false)
    const [capacityDialogOpen, setCapacityDialogOpen] = useState(false)

    const isEdit = mode === 'edit'

    const saving = createTruck.isPending || updateTruck.isPending

    const loading = loadingTypes || loadingCapacities

    useEffect(() => {
        if (!open) {
            return
        }

        setError('')
        setFieldErrors({})

        if (isEdit && initialData) {
            setForm({
                truckType: String(
                    initialData.truckType?.id ?? initialData.truck_type?.id ?? initialData.truck_type ?? '',
                ),
                capacity: String(initialData.capacity?.id ?? initialData.capacity_id ?? ''),
                licensePlate: initialData.licensePlate ?? initialData.license_plate ?? '',
                description: initialData.description ?? '',
            })

            return
        }

        setForm(emptyForm)
    }, [open, isEdit, initialData])

    const onChange = (field) => (event) => {
        const value = field === 'licensePlate' ? normalizePlate(event.target.value) : event.target.value

        setForm((prev) => ({
            ...prev,
            [field]: value,
        }))

        setFieldErrors((prev) => ({
            ...prev,
            [field]: '',
        }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        setError('')
        setFieldErrors({})

        const payload = {
            carrier: Number(carrierId),
            truckType: Number(form.truckType),
            capacity: Number(form.capacity),
            licensePlate: normalizePlate(form.licensePlate),
            description: form.description,
        }

        try {
            let savedTruck

            if (isEdit) {
                savedTruck = await updateTruck.mutateAsync({
                    id: initialData.id,
                    payload,
                })
            } else {
                savedTruck = await createTruck.mutateAsync({
                    carrierId,
                    payload,
                })
            }

            await onSaved?.(savedTruck)
        } catch (err) {
            const errors = err.response?.data?.errors ?? {}

            setFieldErrors({
                truckType: errors.truckType?.[0] ?? errors.truck_type?.[0] ?? '',
                capacity: errors.capacity?.[0] ?? '',
                licensePlate: errors.licensePlate?.[0] ?? errors.license_plate?.[0] ?? '',
            })

            setError(errors.carrier?.[0] ?? err.response?.data?.messages?.[0] ?? firstError(err))
        }
    }

    return (
        <>
            <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
                <DialogTitle>{isEdit ? 'Редактировать автомобиль' : 'Добавить автомобиль'}</DialogTitle>

                <DialogContent sx={{ pt: 1, pb: 1 }}>
                    <Stack
                        component="form"
                        id="truck-dialog-form"
                        onSubmit={handleSubmit}
                        spacing={1.5}
                        sx={{ mt: 0.5 }}
                    >
                        {error && <Alert severity="error">{error}</Alert>}

                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <FormControl size="small" fullWidth required error={Boolean(fieldErrors.truckType)}>
                                <InputLabel id="truck-type-dialog-label">Тип</InputLabel>

                                <Select
                                    labelId="truck-type-dialog-label"
                                    label="Тип"
                                    variant="outlined"
                                    value={form.truckType}
                                    onChange={onChange('truckType')}
                                >
                                    {truckTypes.map((item) => (
                                        <MenuItem key={item.id} value={String(item.id)}>
                                            {item.truckType}
                                        </MenuItem>
                                    ))}
                                </Select>

                                {fieldErrors.truckType && <FormHelperText>{fieldErrors.truckType}</FormHelperText>}
                            </FormControl>

                            <AddAction
                                title="Добавить тип"
                                onClick={(event) => {
                                    event.currentTarget.blur()
                                    setTypeDialogOpen(true)
                                }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <FormControl size="small" fullWidth required error={Boolean(fieldErrors.capacity)}>
                                <InputLabel id="truck-capacity-dialog-label">Грузоподъёмность</InputLabel>

                                <Select
                                    labelId="truck-capacity-dialog-label"
                                    label="Грузоподъёмность"
                                    value={form.capacity}
                                    variant="outlined"
                                    onChange={onChange('capacity')}
                                >
                                    {capacities.map((item) => (
                                        <MenuItem key={item.id} value={String(item.id)}>
                                            {item.capacity}
                                        </MenuItem>
                                    ))}
                                </Select>

                                {fieldErrors.capacity && <FormHelperText>{fieldErrors.capacity}</FormHelperText>}
                            </FormControl>

                            <AddAction
                                title="Добавить грузоподъёмность"
                                onClick={(event) => {
                                    event.currentTarget.blur()
                                    setCapacityDialogOpen(true)
                                }}
                            />
                        </Stack>

                        <TextField
                            size="small"
                            label="Госномер"
                            value={form.licensePlate}
                            onChange={onChange('licensePlate')}
                            required
                            fullWidth
                            error={Boolean(fieldErrors.licensePlate)}
                            helperText={fieldErrors.licensePlate}
                        />

                        <TextField
                            size="small"
                            label="Примечание"
                            value={form.description}
                            onChange={onChange('description')}
                            multiline
                            minRows={3}
                            fullWidth
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

                    <Button
                        type="submit"
                        form="truck-dialog-form"
                        variant="contained"
                        disabled={saving || loading || !form.truckType || !form.capacity || !form.licensePlate}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <TruckTypeCreateDialog
                open={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                onCreated={async (created) => {
                    await refetchTruckTypes()

                    setForm((prev) => ({
                        ...prev,
                        truckType: String(created.id),
                    }))

                    setTypeDialogOpen(false)
                }}
            />

            <TruckCapacityCreateDialog
                open={capacityDialogOpen}
                onClose={() => setCapacityDialogOpen(false)}
                onCreated={async (created) => {
                    await refetchCapacities()

                    setForm((prev) => ({
                        ...prev,
                        capacity: String(created.id),
                    }))

                    setCapacityDialogOpen(false)
                }}
            />
        </>
    )
}
