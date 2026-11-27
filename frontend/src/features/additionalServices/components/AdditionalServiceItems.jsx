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
    useAdditionalTransportServices,
    useCreateAdditionalTransportService,
} from '../utils/additionalServices.serviceCatalog.js'

const CATEGORIES = [
    { key: 'specialist', title: 'УСЛУГИ', footer: 'Итого услуги' },
    { key: 'transport', title: 'ТРАНСПОРТ', footer: 'Итого транспорт' },
]

const sectionSx = { ...sx.specificationSection, mt: 2, minWidth: 0 }
const headerSx = { ...sx.specificationHeader, alignItems: 'center', gap: 2, mb: 1 }
const rowSx = { py: 1.5, borderBottom: '1px solid', borderColor: 'divider', minWidth: 0 }

// Both sections use the same grid tracks and the same catalog-creation action.
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
    const [createTarget, setCreateTarget] = useState(null)

    const hasSpecialists = items.some((row) => row.category === 'specialist')
    const showSpecialists = providerType === 'repair_company' || hasSpecialists
    const specialistQuery = useAdditionalRepairServices(showSpecialists)
    const transportQuery = useAdditionalTransportServices()
    const createSpecialist = useCreateAdditionalRepairService()
    const createTransport = useCreateAdditionalTransportService()
    const specialistOptions = useMemo(() => specialistQuery.data || [], [specialistQuery.data])
    const transportOptions = useMemo(() => transportQuery.data || [], [transportQuery.data])
    const canCreateService = !disabled && hasPermission('additional_services.add_additionalservicerequest')
    const totals = previewTotals(items)

    const activeCreate = createTarget?.category === 'transport' ? createTransport : createSpecialist
    const closeCreateDialog = () => {
        if (!activeCreate.isPending) setCreateTarget(null)
    }

    return (
        <>
            {CATEGORIES.filter((group) => group.key === 'transport' || showSpecialists).map((group) => {
                const rows = items.filter((row) => row.category === group.key)
                const amount = totals.by_category[group.key]
                const mayAddRow = !disabled && !(group.key === 'specialist' && providerType === 'carrier')
                const isSpecialist = group.key === 'specialist'
                const query = isSpecialist ? specialistQuery : transportQuery
                const options = isSpecialist ? specialistOptions : transportOptions
                const relationKey = isSpecialist ? 'service' : 'transport_service'
                const selectedIds = items
                    .filter((item) => item.category === group.key && item[relationKey])
                    .map((item) => String(item[relationKey]))

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

                        {query.isError && (
                            <Alert severity="warning" sx={{ my: 1 }}>
                                {isSpecialist ? 'Не удалось загрузить справочник услуг.' : 'Не удалось загрузить транспортный справочник.'}{' '}
                                <Button size="small" onClick={() => query.refetch()}>
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
                            const matched = options.find(
                                (option) => String(option.id) === String(row[relationKey]),
                            )
                            // Keep the saved name when the catalog entry was renamed or archived.
                            const selectedChoice = matched
                                ? { ...matched, name: row.name || matched.name }
                                : row.name
                                  ? { id: row[relationKey] || `legacy-${row.localId}`, name: row.name, historical: true }
                                  : null
                            const choices = selectedChoice?.historical ? [selectedChoice, ...options] : options

                            return (
                                <Box key={row.localId} sx={rowSx}>
                                    <Box sx={fieldsSx}>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={choices}
                                            value={selectedChoice}
                                            disabled={disabled || query.isLoading}
                                            getOptionLabel={(option) => option?.name || ''}
                                            isOptionEqualToValue={(option, value) =>
                                                String(option.id) === String(value.id)
                                            }
                                            getOptionDisabled={(option) =>
                                                Boolean(option.historical) ||
                                                (selectedIds.includes(String(option.id)) &&
                                                    String(option.id) !== String(row[relationKey]))
                                            }
                                            onChange={(_, option) =>
                                                onChange(row.localId, {
                                                    [relationKey]: option ? String(option.id) : '',
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

                                        {canCreateService ? (
                                            <AddAction
                                                title={isSpecialist
                                                    ? 'Добавить услугу в справочник'
                                                    : 'Добавить транспортную услугу в справочник'}
                                                onClick={() => setCreateTarget({ rowId: row.localId, category: group.key })}
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
                open={createTarget !== null}
                title={createTarget?.category === 'transport' ? 'Добавить транспортную услугу' : 'Добавить услугу'}
                label={createTarget?.category === 'transport' ? 'Наименование транспортной услуги' : 'Наименование услуги'}
                saving={activeCreate.isPending}
                onCreate={(name) => activeCreate.mutateAsync(name)}
                errorMessage="Не удалось добавить услугу."
                onClose={closeCreateDialog}
                onCreated={(created) => {
                    if (createTarget !== null) {
                        const key = createTarget.category === 'transport' ? 'transport_service' : 'service'
                        onChange(createTarget.rowId, { [key]: String(created.id), name: created.name })
                    }
                    setCreateTarget(null)
                }}
            />
        </>
    )
}
