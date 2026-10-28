import {useMemo, useState} from 'react'

import {Autocomplete, Box, Checkbox, Divider, FormControlLabel, Stack, TextField, Typography} from '@mui/material'

import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

import { repairSpecificationListSx as sx } from './RepairSpecificationList.styles.js'
import AddAction from "../../../components/ui/buttons/AddAction.jsx";
import RepairSpecificationItemCreateDialog from './RepairSpecificationItemCreateDialog.jsx'
import { useCreateRepairService } from '../utils/repair.services.queries.js'

export default function RepairSpecificationServicesList({
                                                            rows,
                                                            serviceErrors = {},
                                                            servicesList,
                                                            onChange,
                                                            onRemove,
                                                            totalServicesPrice,
                                                            totalServicesPriceRebillable,
                                                        }) {
    const selectedServiceIds = useMemo(() => rows.map((row) => row.serviceId).filter(Boolean), [rows])
    const [createForRowId, setCreateForRowId] = useState(null)
    const createService = useCreateRepairService()

    return (
        <Stack spacing={1}>
            {rows.length === 0 && (
                <Typography color="text.secondary" sx={sx.emptyText}>
                    Добавьте услугу.
                </Typography>
            )}

            {rows.map((row) => {
                const selectedService = servicesList.find((service) => service.id === row.serviceId) || null

                const rowErrors = serviceErrors[row.id] || {}

                return (
                    <Box key={row.id} sx={sx.row}>
                        <Box sx={sx.fields}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={servicesList}
                                value={selectedService}
                                getOptionLabel={(option) => option?.name || ''}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionDisabled={(option) =>
                                    selectedServiceIds.includes(option.id) && option.id !== row.serviceId
                                }
                                onChange={(_, newValue) =>
                                    onChange(row.id, {
                                        serviceId: newValue?.id || '',
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Услуга"
                                        placeholder="Начните вводить название"
                                        error={Boolean(rowErrors.serviceId)}
                                        helperText={rowErrors.serviceId || ''}
                                    />
                                )}
                                sx={sx.itemField}
                            />

                            <AddAction
                                title="Добавить услугу"
                                onClick={() => setCreateForRowId(row.id)}
                            />

                            <TextField
                                size="small"
                                label="Кол-во"
                                type="number"
                                required
                                value={row.quantity}
                                onChange={(e) =>
                                    onChange(row.id, {
                                        quantity: e.target.value,
                                    })
                                }
                                error={Boolean(rowErrors.quantity)}
                                helperText={rowErrors.quantity || ''}
                                slotProps={{
                                    htmlInput: {
                                        min: 0.01,
                                        step: '0.01',
                                    },
                                }}
                                sx={sx.quantityField}
                            />

                            <TextField
                                size="small"
                                label="Цена"
                                type="number"
                                required
                                value={row.price_per_item}
                                onChange={(e) =>
                                    onChange(row.id, {
                                        price_per_item: e.target.value,
                                    })
                                }
                                error={Boolean(rowErrors.price_per_item)}
                                helperText={rowErrors.price_per_item || ''}
                                slotProps={{
                                    htmlInput: {
                                        min: 0,
                                        step: '0.01',
                                    },
                                }}
                                sx={sx.priceField}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={Boolean(row.is_rebillable)}
                                        onChange={(e) =>
                                            onChange(row.id, {
                                                is_rebillable: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Перевыставить"
                                sx={sx.rebillableField}
                            />

                            <Box sx={sx.deleteAction}>
                                <DeleteAction onClick={() => onRemove(row.id)} />
                            </Box>
                        </Box>
                    </Box>
                )
            })}

            <Divider />

            <Box sx={sx.totalFooter}>
                <Typography variant="h6">
                    Итого услуги:
                </Typography>
                <Typography variant="h6" sx={sx.totalValue}>
                    {totalServicesPrice} руб.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    (в том числе клиенту: {totalServicesPriceRebillable} руб.)
                </Typography>
            </Box>

            <RepairSpecificationItemCreateDialog
                open={Boolean(createForRowId)}
                title="Добавить услугу"
                label="Наименование услуги"
                mutation={createService}
                errorMessage="Не удалось добавить услугу"
                onClose={() => setCreateForRowId(null)}
                onCreated={(created) => {
                    if (createForRowId) {
                        onChange(createForRowId, {
                            serviceId: created.id,
                        })
                    }

                    setCreateForRowId(null)
                }}
            />
        </Stack>

    )
}
