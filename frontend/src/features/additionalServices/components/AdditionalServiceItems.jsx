import { useMemo, useState } from 'react'

import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'
import ReferenceItemCreateDialog from '../../../components/ui/dialogs/ReferenceItemCreateDialog.jsx'
import { useAuth } from '../../../pages/auth/context/useAuth.js'
import { repairRequestFormSx as sx } from '../../repairs/RepairRequestForm.styles.js'
import { formatCents, previewTotals } from '../utils/additionalServices.logic.js'
import {
    useAdditionalRepairServices,
    useCreateAdditionalRepairService,
} from '../utils/additionalServices.serviceCatalog.js'

const CATEGORIES = [
    { key: 'specialist', title: 'УСЛУГИ', footer: 'Итого услуги' },
    { key: 'transport', title: 'ТРАНСПОРТ', footer: 'Итого транспорт' },
]

const sectionSx = { ...sx.specificationSection, mt: 2, minWidth: 0 }
const headerSx = { ...sx.specificationHeader, alignItems: 'center', gap: 2, mb: 1 }
const rowSx = { py: 1.5, borderBottom: '1px solid', borderColor: 'divider', minWidth: 0 }

// Identical tracks in both sections: the second slot is reserved for the
// "add to directory" button, even in the transport (free-text) section.
const fieldsSx = {
    display: 'grid',
    gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        md: 'minmax(0, 2fr) 36px minmax(90px, 1fr) minmax(115px, 1fr) minmax(115px, 1fr)',
        lg: 'minmax(180px, 2.2fr) 36px minmax(86px, .65fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(150px, 1fr) 36px',
    },
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
}

export default function AdditionalServiceItems({ items, providerType, onChange, onAdd, onRemove, disabled }) {
    const { hasPermission } = useAuth()
    const [createForRow, setCreateForRow] = useState(null)

    const hasSpecialists = items.some((row) => row.category === 'specialist')
    const showSpecialists = providerType === 'repair_company' || hasSpecialists
    const catalogQuery = useAdditionalRepairServices(showSpecialists)
    const createService = useCreateAdditionalRepairService()
    const options = useMemo(() => catalogQuery.data || [], [catalogQuery.data])
    const selectedIds = items
        .filter((row) => row.category === 'specialist' && row.service)
        .map((row) => String(row.service))
    const canCreateService = !disabled && hasPermission('additional_services.add_additionalservicerequest')
    const totals = previewTotals(items)

    const closeCreateDialog = () => {
        if (!createService.isPending) setCreateForRow(null)
    }

    return (
        <>
            {CATEGORIES.filter((group) => group.key === 'transport' || showSpecialists).map((group) => {
                const rows = items.filter((row) => row.category === group.key)
                const amount = totals.by_category[group.key]
                const mayAddRow = !disabled && !(group.key === 'specialist' && providerType === 'carrier')

                return (
                    <Box key={group.key} sx={sectionSx}>
                        <Stack direction="row" sx={headerSx}>
                            <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                                {group.title}
                            </Typography>
                            {!disabled && (
                                <AddAction
                                    title="Добавить позицию"
                                    onClick={() => onAdd(group.key)}
                                    disabled={!mayAddRow}
                                />
                            )}
                        </Stack>

                        <Divider sx={sx.divider} />

                        {group.key === 'specialist' && catalogQuery.isError && (
                            <Alert severity="warning" sx={{ my: 1 }}>
                                Не удалось загрузить справочник услуг специалиста.{' '}
                                <Button size="small" onClick={() => catalogQuery.refetch()}>
                                    Повторить
                                </Button>
                            </Alert>
                        )}

                        {rows.length === 0 && (
                            <Typography color="text.secondary" sx={{ py: 2 }}>
                                Добавьте позицию.
                            </Typography>
                        )}

                        {rows.map((row) => {
                            const matched =
                                group.key === 'specialist'
                                    ? options.find((option) => String(option.id) === String(row.service))
                                    : null
                            // Preserve the text on historical rows and on renamed/archived services.
                            const selectedChoice = matched
                                ? { ...matched, name: row.name || matched.name }
                                : row.name && group.key === 'specialist'
                                  ? { id: row.service || `legacy-${row.localId}`, name: row.name, historical: true }
                                  : null
                            const choices = selectedChoice?.historical ? [selectedChoice, ...options] : options

                            return (
                                <Box key={row.localId} sx={rowSx}>
                                    <Box sx={fieldsSx}>
                                        {group.key === 'specialist' ? (
                                            <Autocomplete
                                                fullWidth
                                                size="small"
                                                options={choices}
                                                value={selectedChoice}
                                                disabled={disabled || catalogQuery.isLoading}
                                                getOptionLabel={(option) => option?.name || ''}
                                                isOptionEqualToValue={(option, value) =>
                                                    String(option.id) === String(value.id)
                                                }
                                                getOptionDisabled={(option) =>
                                                    Boolean(option.historical) ||
                                                    (selectedIds.includes(String(option.id)) &&
                                                        String(option.id) !== String(row.service))
                                                }
                                                onChange={(_, option) =>
                                                    onChange(row.localId, {
                                                        service: option ? String(option.id) : '',
                                                        name: option?.name || '',
                                                    })
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Услуга"
                                                        placeholder="Начните вводить название"
                                                        required
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <TextField
                                                label="Наименование работы"
                                                size="small"
                                                value={row.name}
                                                onChange={(event) =>
                                                    onChange(row.localId, { name: event.target.value })
                                                }
                                                disabled={disabled}
                                                required
                                                fullWidth
                                            />
                                        )}

                                        {group.key === 'specialist' && canCreateService ? (
                                            <AddAction
                                                title="Добавить услугу в справочник"
                                                onClick={() => setCreateForRow(row.localId)}
                                            />
                                        ) : (
                                            <Box sx={{ width: 36, height: 36 }} />
                                        )}

                                        <TextField
                                            label="Кол-во"
                                            type="number"
                                            size="small"
                                            value={row.quantity}
                                            onChange={(event) =>
                                                onChange(row.localId, { quantity: event.target.value })
                                            }
                                            slotProps={{ htmlInput: { min: '0.001', step: '0.001' } }}
                                            disabled={disabled}
                                            required
                                            fullWidth
                                        />

                                        <TextField
                                            label="Наши расходы/ед."
                                            type="number"
                                            size="small"
                                            value={row.cost_per_unit}
                                            onChange={(event) =>
                                                onChange(row.localId, { cost_per_unit: event.target.value })
                                            }
                                            slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                            disabled={disabled}
                                            required
                                            fullWidth
                                        />

                                        <TextField
                                            label="Заказчику/ед."
                                            type="number"
                                            size="small"
                                            value={row.price_per_unit}
                                            onChange={(event) =>
                                                onChange(row.localId, { price_per_unit: event.target.value })
                                            }
                                            slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
                                            disabled={disabled}
                                            required
                                            fullWidth
                                        />

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={Boolean(row.is_rebillable)}
                                                    disabled={disabled}
                                                    onChange={(event) =>
                                                        onChange(row.localId, {
                                                            is_rebillable: event.target.checked,
                                                        })
                                                    }
                                                />
                                            }
                                            label="Перевыставить"
                                            sx={{ m: 0 }}
                                        />

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            {!disabled && <DeleteAction onClick={() => onRemove(row.localId)} />}
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        })}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                            sx={{ py: 2 }}
                        >
                            <Typography variant="h6">{group.footer} (расходы):</Typography>
                            <Typography variant="h6" sx={sx.specificationGrandTotalValue}>
                                {formatCents(amount.cost)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Заказчику: {formatCents(amount.charge)}
                            </Typography>
                        </Stack>
                    </Box>
                )
            })}

            <ReferenceItemCreateDialog
                open={createForRow !== null}
                title="Добавить услугу"
                label="Наименование услуги"
                saving={createService.isPending}
                onCreate={(name) => createService.mutateAsync(name)}
                errorMessage="Не удалось добавить услугу."
                onClose={closeCreateDialog}
                onCreated={(created) => {
                    if (createForRow != null) {
                        onChange(createForRow, { service: String(created.id), name: created.name })
                    }
                    setCreateForRow(null)
                }}
            />
        </>
    )
}
