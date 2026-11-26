import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useAuth } from '../../pages/auth/context/useAuth.js'
import { entityTableListSx as listSx } from '../../styles/entityTableList.styles.js'
import { firstError } from '../../utils/apiError.js'
import {
    useGetCustomerContracts,
    useGetCustomerObjects,
    useGetCustomers,
} from '../customers/utils/customers.queries.js'
import { useUnsavedGuard } from '../orders/hooks/useUnsavedGuard.js'
import { fieldsetStyles, repairRequestFormSx as sx } from '../repairs/RepairRequestForm.styles.js'

import AdditionalServiceItems from './components/AdditionalServiceItems.jsx'
import {
    DIRECTION_OPTIONS,
    emptyForm,
    emptyItem,
    PROVIDER_OPTIONS,
    STATUS_OPTIONS,
    localISODate,
} from './utils/additionalServices.constants.js'
import { formatCents, previewTotals, toForm, toPayload, validateForm } from './utils/additionalServices.logic.js'
import {
    useAdditionalService,
    useAdditionalServiceProviders,
    useCreateAdditionalService,
    useUpdateAdditionalService,
} from './utils/additionalServices.queries.js'

const LIST_PATH = '/additional-services'

const mapIdsToStrings = (values) => values.map((item) => ({ ...item, id: String(item.id) }))

const includeArchived = (choices, selected, label) => {
    if (!selected || choices.some((item) => String(item.id) === String(selected))) return choices
    return [{ id: String(selected), name: `${label} №${selected} (архивный)` }, ...choices]
}

// Match the repair form's three-column layout while remaining usable on narrow screens.
const columnsSx = {
    display: 'grid',
    gap: 3,
    width: '100%',
    minWidth: 0,
    mb: 2,
    alignItems: 'stretch',
    ...sx.formColumns,
    gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        md: 'minmax(280px, 440px) minmax(280px, 440px) minmax(280px, 1fr)',
    },
}

// Both fieldsets use four identical grid tracks. Each control has no external margin.
// This avoids the mt: 2 built into the shared AppSelectField component, which
// makes the individual select controls drift relative to the date field.
const alignedFieldsSx = {
    display: 'grid',
    gridTemplateRows: 'repeat(5, 40px)',
    gap: 2,
    alignContent: 'start',
    minWidth: 0,
}

const alignedFieldRowSx = {
    minWidth: 0,
    minHeight: 0,
    height: 40,
    '& > .MuiFormControl-root': {
        width: '100%',
        minWidth: 0,
        height: '100%',
        m: 0,
    },
    '& .MuiInputBase-root': {
        height: '100%',
    },
}

// A select used only by this form: unlike AppSelectField it has no mt: 2.
// Preserve the same outlined MUI appearance, options and archived-ID fallback.
function AlignedSelectField({
    id,
    label,
    value,
    options = [],
    onChange,
    disabled = false,
    required = false,
    includeAll = true,
    allLabel = 'Все',
}) {
    const selected = options.some((option) => option.id === value)
        ? value
        : ''

    return (
        <FormControl
            fullWidth
            size="small"
            variant="outlined"
            disabled={disabled}
            required={required}
            sx={{ m: 0, minWidth: 0, height: '100%' }}
        >
            <InputLabel id={`${id}-label`}>{label}</InputLabel>
            <Select
                id={id}
                labelId={`${id}-label`}
                label={label}
                value={selected}
                onChange={(event) => onChange(event.target.value)}
                sx={{ height: '100%' }}
            >
                {includeAll && <MenuItem value="">{allLabel}</MenuItem>}
                {options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default function AdditionalServiceForm() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()
    const { hasPermission } = useAuth()

    const canChange = hasPermission('additional_services.change_additionalservicerequest')
    const canAdd = hasPermission('additional_services.add_additionalservicerequest')
    const disabled = isEdit ? !canChange : !canAdd

    const detail = useAdditionalService(id)
    const create = useCreateAdditionalService()
    const update = useUpdateAdditionalService()

    const loadedId = useRef(null)
    const [form, setForm] = useState(emptyForm)
    const initialNewForm = useRef(JSON.stringify(form))
    const [initialState, setInitialState] = useState(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const saved = detail.data

    useEffect(() => {
        if (!isEdit || !saved || loadedId.current === id) return
        const value = toForm(saved)
        setForm(value)
        setInitialState(JSON.stringify(value))
        loadedId.current = id
    }, [saved, id, isEdit])

    const { data: customers = [] } = useGetCustomers()
    const objectsQuery = useGetCustomerObjects(form.customerId)
    const contractsQuery = useGetCustomerContracts(form.customerId)
    const providersQuery = useAdditionalServiceProviders(form.providerType)

    const customerOptions = includeArchived(mapIdsToStrings(customers), form.customerId, 'Контрагент')
    const objectOptions = includeArchived(
        mapIdsToStrings(objectsQuery.data ?? []),
        form.construction_object,
        'Объект',
    )
    const contractOptions = includeArchived(
        mapIdsToStrings(contractsQuery.data ?? []).map((contract) => ({
            ...contract,
            name: `№ ${contract.contract_number || contract.id} · ${contract.is_active ? 'Действующий' : 'Архивный'}`,
        })),
        form.rental_contract,
        'Договор',
    )
    const providerOptions = includeArchived(
        mapIdsToStrings(providersQuery.data ?? []),
        form.providerId,
        'Исполнитель',
    )

    const totals = previewTotals(form.items)
    const saving = busy || create.isPending || update.isPending
    const snapshot = JSON.stringify(form)
    const isDirty = isEdit
        ? initialState !== null && snapshot !== initialState
        : snapshot !== initialNewForm.current

    const { confirmOpen, handleNavigate, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)

    const set = (name, value) => setForm((previous) => ({
        ...previous,
        [name]: value,
        ...(name === 'customerId' ? { construction_object: '', rental_contract: '' } : {}),
        ...(name === 'providerType' ? { providerId: '' } : {}),
        // A closed request has an editable closing date, prefilled once.
        ...(name === 'status' && value === 'closed'
            ? { closing_date: previous.closing_date || localISODate() }
            : {}),
        ...(name === 'status' && value === 'open' ? { closing_date: '' } : {}),
    }))

    const changeRow = (localId, changes) => setForm((previous) => ({
        ...previous,
        items: previous.items.map((item) =>
            item.localId === localId ? { ...item, ...changes } : item),
    }))
    const addRow = (category) => setForm((previous) => ({
        ...previous,
        items: [...previous.items, emptyItem(category)],
    }))
    const removeRow = (localId) => setForm((previous) => ({
        ...previous,
        items: previous.items.filter((row) => row.localId !== localId),
    }))

    const submit = async (event) => {
        event.preventDefault()
        if (saving || disabled || !isDirty) return

        const errors = validateForm(form)
        if (errors.length > 0) {
            setError(errors.join('\n'))
            return
        }

        setError('')
        const payload = toPayload(form, isEdit ? saved : null)
        setBusy(true)

        try {
            if (isEdit) await update.mutateAsync({ id, payload })
            else await create.mutateAsync(payload)
            navigate(LIST_PATH, { replace: true })
        } catch (requestError) {
            setError(firstError(requestError) || 'Не удалось сохранить заявку.')
        } finally {
            setBusy(false)
        }
    }

    const hasIncompatibleSpecialistItems = form.providerType === 'carrier'
        && form.items.some((item) => item.category === 'specialist')

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />

            <Box component="form" noValidate onSubmit={submit} sx={sx.form}>
                <Box
                    sx={{
                        ...sx.header,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        minWidth: 0,
                        p: 3,
                    }}
                >
                    <Typography variant="h4" fontWeight={600} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                        {isEdit
                            ? `Редактирование заявки на дополнительные услуги № ${id}`
                            : 'Заявка на дополнительные услуги'}
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                        {!disabled && (
                            <Button type="submit" variant="contained" disabled={saving || !isDirty}>
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        )}
                        <Button variant="outlined" onClick={() => handleNavigate(LIST_PATH)} disabled={saving}>
                            Отмена
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={sx.divider} />

                {error && (
                    <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {detail.isError && isEdit ? (
                    <ErrorState
                        error={detail.error}
                        onRetry={() => detail.refetch()}
                        loading={detail.isFetching}
                    />
                ) : isEdit && detail.isLoading && !saved ? (
                    <Box sx={sx.loading}>
                        <CircularProgress aria-label="Загрузка..." />
                    </Box>
                ) : (
                    <>
                        {providersQuery.isError && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Не удалось загрузить исполнителей. Проверьте API дополнительных услуг.
                            </Alert>
                        )}

                        <Box sx={columnsSx}>
                            <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
                                <Typography component="legend" variant="caption" sx={sx.legend}>
                                    Открытие заявки:
                                </Typography>

                                <Box sx={alignedFieldsSx}>
                                    <Box sx={alignedFieldRowSx}>
                                        <TextField
                                            label="Дата услуги"
                                            type="date"
                                            size="small"
                                            value={form.service_date}
                                            disabled={disabled}
                                            onChange={(event) => set('service_date', event.target.value)}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            sx={sx.field}
                                            required
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-customer-form"
                                            label="Контрагент"
                                            required
                                            value={form.customerId}
                                            options={customerOptions}
                                            onChange={(value) => set('customerId', value)}
                                            disabled={disabled}
                                            includeAll={false}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-object-form"
                                            label="Объект"
                                            required
                                            value={form.construction_object}
                                            options={objectOptions}
                                            onChange={(value) => set('construction_object', value)}
                                            disabled={disabled || (!form.customerId && !form.construction_object)}
                                            includeAll={false}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-contract-form"
                                            label="Договор аренды"
                                            required
                                            value={form.rental_contract}
                                            options={contractOptions}
                                            onChange={(value) => set('rental_contract', value)}
                                            disabled={disabled || !form.customerId}
                                            includeAll={false}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
                                <Typography component="legend" variant="caption" sx={sx.legend}>
                                    Выполнение заявки:
                                </Typography>

                                <Box sx={alignedFieldsSx}>
                                    <Box sx={alignedFieldRowSx}>
                                        <TextField
                                            label="Дата закрытия заявки"
                                            type="date"
                                            size="small"
                                            value={form.closing_date || ''}
                                            disabled={disabled || form.status !== 'closed'}
                                            onChange={(event) => set('closing_date', event.target.value)}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            sx={sx.field}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-direction-form"
                                            label="Направление"
                                            required
                                            value={form.direction}
                                            options={DIRECTION_OPTIONS}
                                            onChange={(value) => set('direction', value)}
                                            disabled={disabled}
                                            includeAll={false}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-status-form"
                                            label="Статус"
                                            value={form.status}
                                            options={STATUS_OPTIONS}
                                            onChange={(value) => set('status', value)}
                                            disabled={disabled}
                                            includeAll={false}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-provider-type"
                                            label="Тип исполнителя"
                                            value={form.providerType}
                                            options={PROVIDER_OPTIONS}
                                            onChange={(value) => set('providerType', value)}
                                            disabled={disabled}
                                            includeAll={false}
                                        />
                                    </Box>

                                    <Box sx={alignedFieldRowSx}>
                                        <AlignedSelectField
                                            id="as-provider-form"
                                            label="Исполнитель"
                                            required
                                            value={form.providerId}
                                            options={providerOptions}
                                            onChange={(value) => set('providerId', value)}
                                            disabled={disabled || providersQuery.isLoading}
                                            includeAll={false}
                                        />
                                    </Box>

                                </Box>
                            </Box>

                            <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
                                <Typography component="legend" variant="caption" sx={sx.legend}>
                                    Описание:
                                </Typography>

                                <TextField
                                    label="Описание заявки"
                                    value={form.description}
                                    onChange={(event) => set('description', event.target.value)}
                                    disabled={disabled}
                                    multiline
                                    minRows={10}
                                    fullWidth
                                    sx={{
                                        ...sx.descriptionField,
                                        flex: 1,
                                        minWidth: 0,
                                        '& .MuiInputBase-root': {
                                            height: '100%',
                                            alignItems: 'flex-start',
                                        },
                                    }}
                                />
                            </Box>
                        </Box>

                        <Divider sx={sx.divider} />

                        <AdditionalServiceItems
                            items={form.items}
                            providerType={form.providerType}
                            onChange={changeRow}
                            onAdd={addRow}
                            onRemove={removeRow}
                            disabled={disabled || saving}
                        />

                        {hasIncompatibleSpecialistItems && (
                            <Alert severity="warning" sx={{ my: 2 }}>
                                При выборе перевозчика позиции специалиста необходимо удалить вручную.
                                Они не удаляются автоматически.
                            </Alert>
                        )}

                        <Box sx={{ mt: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                                ИТОГО ПО ЗАЯВКЕ — РАСХОДЫ: {formatCents(totals.cost)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                К перевыставлению заказчику: {formatCents(totals.charge)}
                            </Typography>
                        </Box>

                    </>
                )}
            </Box>

            <ConfirmDialog
                open={confirmOpen}
                title="Есть несохранённые изменения"
                text="Вы изменили форму. Уйти без сохранения?"
                confirmText="Уйти"
                cancelText="Остаться"
                onClose={handleCancel}
                onConfirm={handleConfirm}
            />
        </Box>
    )
}
