import { useState } from 'react'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Radio,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'

import { objectDetailWithContactListSx as detailSx } from '../../components/ObjectDetailWithContactList.styles.js'
import AddAction from '../../components/ui/buttons/AddAction.jsx'
import IconAction from '../../components/ui/buttons/IconAction.jsx'

import {
    useCreateCustomerContract,
    useDeleteCustomerContract,
    useGetCustomerContracts,
    useUpdateCustomerContract,
} from './utils/customers.queries.js'

const EMPTY_FORM = { contract_number: '', contract_date: '' }

function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return value || ''
    const [year, month, day] = value.split('-')
    return `${day}.${month}.${year}`
}

function contractLabel(contract) {
    return `№ ${contract.contract_number} от ${formatDate(contract.contract_date)}`
}

function errorMessage(error) {
    const data = error?.response?.data
    if (data?.code === 'contract_in_use' ||
        (error?.response?.status === 409 && error?.config?.method === 'delete')) {
        return 'Нельзя удалить договор: он уже используется в системе.'
    }
    const messages = data?.messages ?? data?.detail ?? data?.errors
    if (typeof messages === 'string') return messages
    if (Array.isArray(messages)) return messages.join(' · ')
    if (messages && typeof messages === 'object') {
        return Object.entries(messages)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
            .join(' · ')
    }
    return error?.message ?? 'Не удалось выполнить операцию с договором.'
}

/**
 * A contract is removable only when the backend confirms it is unused.
 * The endpoint also validates DELETE on the server; is_used is just a UI hint.
 */
export default function CustomerRentalContractsInline({ customerId, readOnly = false }) {
    const { data: contracts = [], isLoading, isError, error: loadError, refetch } = useGetCustomerContracts(customerId)
    const createMutation = useCreateCustomerContract()
    const updateMutation = useUpdateCustomerContract()
    const deleteMutation = useDeleteCustomerContract()

    const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
    const [historyOpen, setHistoryOpen] = useState(false)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [actionError, setActionError] = useState('')

    const activeContract = contracts.find((contract) => contract.is_active) ?? null
    const validForm = form.contract_number.trim().length > 0
        && form.contract_number.trim().length <= 20
        && /^\d{4}-\d{2}-\d{2}$/.test(form.contract_date)
    const modified = !editing || form.contract_number.trim() !== editing.contract_number
        || form.contract_date !== editing.contract_date

    const run = async (action, onSuccess) => {
        if (busy || readOnly) return
        setActionError('')
        try {
            await action()
            onSuccess?.()
        } catch (err) {
            // Keep the deletion confirmation open if the backend rejects removal.
            setActionError(errorMessage(err))
            if (err?.response?.status === 409) void refetch()
        }
    }

    const openCreate = () => {
        setActionError('')
        setEditing(null)
        setForm(EMPTY_FORM)
        setFormOpen(true)
    }

    const openEdit = (contract) => {
        setActionError('')
        setEditing(contract)
        setForm({ contract_number: contract.contract_number, contract_date: contract.contract_date })
        setFormOpen(true)
    }

    const saveForm = () => {
        if (!validForm || !modified) return
        const payload = {
            contract_number: form.contract_number.trim(),
            contract_date: form.contract_date,
        }
        if (editing) {
            // Do not send is_active when correcting the number/date.
            run(
                () => updateMutation.mutateAsync({ customerId, contractId: editing.id, payload }),
                () => setFormOpen(false),
            )
        } else {
            run(
                () => createMutation.mutateAsync({ customerId, payload: { ...payload, is_active: true } }),
                () => setFormOpen(false),
            )
        }
    }

    const activate = (contract) => {
        if (contract.is_active || busy || readOnly) return
        run(() => updateMutation.mutateAsync({
            customerId,
            contractId: contract.id,
            payload: { is_active: true },
        }))
    }

    const remove = () => {
        if (!confirmDelete || confirmDelete.is_used !== false) return
        run(
            () => deleteMutation.mutateAsync({ customerId, contractId: confirmDelete.id }),
            () => setConfirmDelete(null),
        )
    }

    return (
        <Box component="section" sx={{ minWidth: 0, width: '100%' }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="flex-start" gap={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={detailSx.fieldLabel}>
                    ДОГОВОР АРЕНДЫ
                </Typography>
                <Stack direction="row" gap={0.5} alignItems="center" sx={{ mt: -0.25 }}>
                    <IconAction
                        title="История договоров"
                        aria-label="История договоров аренды"
                        disabled={isLoading || isError}
                        sx={{ p: 0.4, '& .MuiSvgIcon-root': { fontSize: 17 } }}
                        onClick={() => { setActionError(''); setHistoryOpen(true); void refetch() }}
                    >
                        <HistoryOutlinedIcon />
                    </IconAction>
                    {!readOnly && (
                        <AddAction
                            title="Добавить договор аренды"
                            aria-label="Добавить договор аренды"
                            loading={createMutation.isPending}
                            disabled={busy || isLoading || isError}
                            sx={{ p: 0.4, '& .MuiSvgIcon-root': { fontSize: 17 } }}
                            onClick={openCreate}
                        />
                    )}
                </Stack>
            </Stack>
            {isLoading ? (
                <CircularProgress size={18} />
            ) : isError ? (
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={() => { void refetch() }}>Повторить</Button>
                }>{errorMessage(loadError)}</Alert>
            ) : activeContract ? (
                <Typography variant="h6" sx={detailSx.fieldValue}>
                    № {activeContract.contract_number} от {formatDate(activeContract.contract_date)}
                </Typography>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.6 }}>
                    {contracts.length === 0 ? 'Договор аренды не создан' : 'Действующий договор не выбран'}
                </Typography>
            )}
            {actionError && !historyOpen && !formOpen && !confirmDelete && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setActionError('')}>
                    {actionError}
                </Alert>
            )}

            <Dialog open={historyOpen} onClose={busy ? undefined : () => setHistoryOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Договоры аренды</DialogTitle>
                <DialogContent dividers>
                    {actionError && !formOpen && !confirmDelete && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
                    {isLoading ? (
                        <Box py={2} textAlign="center"><CircularProgress size={26} /></Box>
                    ) : isError ? (
                        <Alert severity="error" action={
                            <Button color="inherit" onClick={() => { void refetch() }}>Повторить</Button>
                        }>{errorMessage(loadError)}</Alert>
                    ) : contracts.length === 0 ? (
                        <Typography color="text.secondary">Договоры ещё не добавлены.</Typography>
                    ) : (
                        <Stack spacing={0}>
                            {contracts.map((contract) => (
                                <Stack key={contract.id} direction="row" gap={1} alignItems="center"
                                    sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Tooltip title={contract.is_active ? 'Действующий договор' : 'Сделать действующим'}>
                                        <span>
                                            <Radio checked={contract.is_active} disabled={busy || readOnly}
                                                onChange={() => activate(contract)}
                                                inputProps={{ 'aria-label': `Сделать действующим ${contractLabel(contract)}` }} />
                                        </span>
                                    </Tooltip>
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="body2" fontWeight={contract.is_active ? 600 : 400}>
                                            {contractLabel(contract)}
                                        </Typography>
                                        {contract.is_active && (
                                            <Typography variant="caption" color="success.main">Действующий</Typography>
                                        )}
                                    </Box>
                                    {!readOnly && (
                                        <>
                                            <IconAction title="Исправить реквизиты" disabled={busy}
                                                onClick={() => openEdit(contract)}
                                                aria-label={`Изменить ${contractLabel(contract)}`}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconAction>
                                            <IconAction title={contract.is_used === false
                                                ? 'Удалить договор'
                                                : contract.is_used === true
                                                    ? 'Договор используется в системе — удаление запрещено'
                                                    : 'Проверка возможности удаления недоступна'}
                                                disabled={busy || contract.is_used !== false}
                                                onClick={() => { setActionError(''); setConfirmDelete(contract) }}
                                                aria-label={`Удалить ${contractLabel(contract)}`}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconAction>
                                        </>
                                    )}
                                </Stack>
                            ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    {!readOnly && (
                        <Button onClick={openCreate} startIcon={<AddOutlinedIcon />} disabled={busy}>
                            Добавить договор
                        </Button>
                    )}
                    <Button onClick={() => setHistoryOpen(false)} disabled={busy} color="inherit">Закрыть</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={formOpen} onClose={busy ? undefined : () => setFormOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{editing ? 'Изменение договора аренды' : 'Новый договор аренды'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {actionError && <Alert severity="error">{actionError}</Alert>}
                        <TextField label="Номер договора" required fullWidth autoFocus
                            value={form.contract_number} disabled={busy}
                            inputProps={{ maxLength: 20 }}
                            onChange={(event) => setForm((prev) => ({ ...prev, contract_number: event.target.value }))} />
                        <TextField label="Дата договора" type="date" required fullWidth
                            value={form.contract_date} disabled={busy} InputLabelProps={{ shrink: true }}
                            onChange={(event) => setForm((prev) => ({ ...prev, contract_date: event.target.value }))} />
                        {!editing && (
                            <Typography variant="caption" color="text.secondary">
                                Новый договор станет действующим; предыдущий останется в истории.
                            </Typography>
                        )}
                        {editing?.is_used && (
                            <Alert severity="warning">
                                Договор используется в системе. Исправление реквизитов изменит их и в связанных данных.
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormOpen(false)} disabled={busy} color="inherit">Отмена</Button>
                    <Button onClick={saveForm} variant="contained" disabled={busy || !validForm || !modified}>
                        {busy ? 'Сохранение…' : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(confirmDelete)} onClose={busy ? undefined : () => setConfirmDelete(null)}
                fullWidth maxWidth="xs">
                <DialogTitle>Удалить договор аренды?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDelete ? contractLabel(confirmDelete) : ''}. Действие нельзя отменить.
                        {confirmDelete?.is_active ? ' После удаления действующего договора нужно выбрать другой.' : ''}
                    </DialogContentText>
                    {actionError && <Alert severity="error" sx={{ mt: 2 }}>{actionError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(null)} disabled={busy} color="inherit">Отмена</Button>
                    <Button onClick={remove} disabled={busy || confirmDelete?.is_used !== false}
                        color="error" variant="contained">
                        {busy ? 'Удаление…' : 'Удалить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
