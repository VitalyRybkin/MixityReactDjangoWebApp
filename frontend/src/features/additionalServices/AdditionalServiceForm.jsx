import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx'
import AppSelectField from '../../components/AppSelectField.jsx'
import { useAuth } from '../../pages/auth/context/useAuth.js'
import { firstError } from '../../utils/apiError.js'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import { useUnsavedGuard } from '../orders/hooks/useUnsavedGuard.js'
import {
    useGetCustomerContracts, useGetCustomerObjects, useGetCustomers,
} from '../customers/utils/customers.queries.js'
import AdditionalServiceItems from './components/AdditionalServiceItems.jsx'
import {
    DIRECTION_OPTIONS, emptyForm, emptyItem, PROVIDER_OPTIONS, STATUS_OPTIONS,
} from './utils/additionalServices.constants.js'
import {
    formatCents, previewTotals, toForm, toPayload, validateForm,
} from './utils/additionalServices.logic.js'
import {
    useAdditionalService, useAdditionalServiceProviders,
    useCreateAdditionalService, useUpdateAdditionalService,
} from './utils/additionalServices.queries.js'

const mapIdsToStrings = (values) => values.map((item) => ({ ...item, id: String(item.id) }))

const includeArchived = (choices, selected, label) => {
    if (!selected || choices.some((v) => String(v.id) === String(selected))) return choices
    return [{ id: String(selected), name: `${label} №${selected} (архивный)` }, ...choices]
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
    const objectOptions = includeArchived(mapIdsToStrings(objectsQuery.data ?? []), form.construction_object, 'Объект')
    const contractOptions = includeArchived(
        mapIdsToStrings(contractsQuery.data ?? []).map((c) => ({ ...c, name: `№ ${c.contract_number || c.id} · ${c.is_active ? 'Действующий' : 'Архивный'}` })),
        form.rental_contract, 'Договор',
    )
    const providerOptions = includeArchived(mapIdsToStrings(providersQuery.data ?? []), form.providerId, 'Исполнитель')
    const totals = previewTotals(form.items)
    const saving = busy || create.isPending || update.isPending
    const isDirty = !isEdit || (initialState !== null && JSON.stringify(form) !== initialState)
    const { confirmOpen, handleNavigate, handleConfirm, handleCancel } = useUnsavedGuard(isDirty && !saving)
    const currentDirection = form.direction

    const set = (name, value) => setForm((old) => ({
        ...old,
        [name]: value,
        ...(name === 'customerId' ? { construction_object: '', rental_contract: '' } : {}),
        ...(name === 'providerType' ? { providerId: '' } : {}),
    }))
    const changeRow = (localId, changes) => setForm((old) => ({
        ...old, items: old.items.map((item) => item.localId === localId ? { ...item, ...changes } : item),
    }))
    const addRow = (category) => setForm((old) => ({ ...old, items: [...old.items, emptyItem(category)] }))
    const removeRow = (localId) => setForm((old) => ({ ...old, items: old.items.filter((row) => row.localId !== localId) }))

    const submit = async (event) => {
        event.preventDefault()
        if (saving || disabled) return
        const errors = validateForm(form)
        if (errors.length > 0) { setError(errors.join('\n')); return }
        setError('')
        const payload = toPayload(form, saved)
        setBusy(true)
        try {
            if (isEdit) await update.mutateAsync({ id, payload })
            else await create.mutateAsync(payload)
            navigate('/additional-services', { replace: true })
        } catch (requestError) {
            setError(firstError(requestError) || 'Не удалось сохранить заявку.')
        } finally {
            setBusy(false)
        }
    }

    if (isEdit && detail.isLoading && !saved) return <Box sx={{ p: 3 }}><CircularProgress /></Box>
    if (isEdit && detail.isError) return <Alert severity="error">{firstError(detail.error)}</Alert>

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs />
            <Box component="form" noValidate onSubmit={submit}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ my: 2 }}>
                    <Typography variant="h5">{isEdit ? `Дополнительная услуга №${id}` : 'Новая дополнительная услуга'}</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button onClick={() => handleNavigate('/additional-services')} disabled={saving}>К списку</Button>
                        {!disabled && <Button type="submit" variant="contained" disabled={saving || !isDirty}>{saving ? 'Сохранение…' : 'Сохранить'}</Button>}
                    </Stack>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setError('')}>{error}</Alert>}
                {providersQuery.isError && <Alert severity="warning" sx={{ mb: 2 }}>Не удалось загрузить исполнителей. Проверьте справочный API дополнительных услуг.</Alert>}
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Заявка</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                        <TextField label="Дата услуги" type="date" size="small" value={form.service_date} disabled={disabled} onChange={(e) => set('service_date', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} required />
                        <AppSelectField id="as-direction-form" label="Направление" value={form.direction} options={DIRECTION_OPTIONS} onChange={(v) => set('direction', v)} disabled={disabled} includeAll={false} sx={{ mt: 0 }} />
                        <AppSelectField id="as-status-form" label="Статус" value={form.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} disabled={disabled} includeAll={false} sx={{ mt: 0 }} />
                        <AppSelectField id="as-customer-form" label="Контрагент" value={form.customerId} options={customerOptions} onChange={(v) => set('customerId', v)} disabled={disabled} includeAll={false} sx={{ mt: 0 }} />
                        <AppSelectField id="as-object-form" label="Объект" value={form.construction_object} options={objectOptions} onChange={(v) => set('construction_object', v)} disabled={disabled || (!form.customerId && !form.construction_object)} includeAll={false} sx={{ mt: 0 }} />
                        <AppSelectField id="as-contract-form" label="Договор аренды (необязательно)" value={form.rental_contract} options={contractOptions} onChange={(v) => set('rental_contract', v)} disabled={disabled || !form.customerId} allLabel="Без договора" sx={{ mt: 0 }} />
                        <AppSelectField id="as-provider-type" label="Тип исполнителя" value={form.providerType} options={PROVIDER_OPTIONS} onChange={(v) => set('providerType', v)} disabled={disabled} includeAll={false} sx={{ mt: 0 }} />
                        <AppSelectField id="as-provider-form" label="Исполнитель" value={form.providerId} options={providerOptions} onChange={(v) => set('providerId', v)} disabled={disabled || providersQuery.isLoading} includeAll={false} sx={{ mt: 0 }} />
                        <TextField label="Описание" size="small" value={form.description} disabled={disabled} onChange={(e) => set('description', e.target.value)} multiline minRows={2} />
                    </Box>
                    {currentDirection !== 'site_work' && <Typography color="text.secondary" variant="caption">Для доставки и возврата обязательна транспортная позиция.</Typography>}
                </Paper>
                <AdditionalServiceItems
                    items={form.items}
                    providerType={form.providerType}
                    onChange={changeRow}
                    onAdd={addRow}
                    onRemove={removeRow}
                    disabled={disabled}
                />
                {form.providerType === 'carrier' && form.items.some((item) => item.category === 'specialist') && (
                    <Alert severity="warning" sx={{ mt: 2 }}>Удалите позиции специалиста перед сохранением заявки с перевозчиком. Они не удаляются автоматически.</Alert>
                )}
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1">Итого по заявке</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 1 }}>
                        <Typography>Расходы: <strong>{formatCents(totals.cost)}</strong></Typography>
                        <Typography>Заказчику: <strong>{formatCents(totals.charge)}</strong></Typography>
                        <Typography>Разница: <strong>{formatCents(totals.margin)}</strong></Typography>
                    </Stack>
                </Paper>
                {!disabled && <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={saving || !isDirty}>Сохранить</Button>
                </Stack>}
                <ConfirmDialog
                    open={confirmOpen}
                    title="Несохранённые изменения"
                    text="Изменения в заявке не сохранены. Перейти к списку без сохранения?"
                    confirmText="Не сохранять"
                    cancelText="Вернуться"
                    onClose={handleCancel}
                    onConfirm={handleConfirm}
                />
            </Box>
        </Box>
    )
}
