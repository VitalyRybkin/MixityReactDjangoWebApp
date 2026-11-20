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
    IconButton,
    Paper,
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
    if (error?.response?.status === 409 || data?.code === 'contract_in_use') {
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
export default function CustomerRentalContracts({ customerId, readOnly = false }) {
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
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap" mb={1}>
                <Typography variant="subtitle1" fontWeight={600}>Договор аренды</Typography>
                <Stack direction="row" gap={1}>
                    <Button size="small" color="inherit" variant="outlined"
                        startIcon={<HistoryOutlinedIcon />}
                        onClick={() => { setActionError(''); setHistoryOpen(true) }}>
                        История
                    </Button>
                    {!readOnly && (
                        <Button size="small" variant="outlined" startIcon={<AddOutlinedIcon />}
                            onClick={openCreate} disabled={busy}>
                            Добавить
                        </Button>
                    )}
                </Stack>
            </Stack>
            {isLoading ? <CircularProgress size={18} /> : activeContract ? (
                <Typography variant="body2">{contractLabel(activeContract)}</Typography>
            ) : (
                <Typography variant="body2" color="text.secondary">Действующий договор не выбран</Typography>
            )}
            {isError && <Alert severity="error" sx={{ mt: 1 }} action={
                <Button color="inherit" size="small" onClick={() => refetch()}>Повторить</Button>
            }>{errorMessage(loadError)}</Alert>}
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
                                            <Tooltip title="Исправить реквизиты">
                                                <span>
                                                    <IconButton size="small" disabled={busy} onClick={() => openEdit(contract)}
                                                        aria-label={`Изменить ${contractLabel(contract)}`}>
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={contract.is_used === false
                                                ? 'Удалить договор'
                                                : contract.is_used === true
                                                    ? 'Договор используется в системе — удаление запрещено'
                                                    : 'Проверка возможности удаления недоступна'}>
                                                <span>
                                                    <IconButton size="small"
                                                        disabled={busy || contract.is_used !== false}
                                                        onClick={() => { setActionError(''); setConfirmDelete(contract) }}
                                                        aria-label={`Удалить ${contractLabel(contract)}`}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
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
        </Paper>
    )
}
