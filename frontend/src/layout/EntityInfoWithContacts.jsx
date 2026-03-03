import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material'

import api from '../api'
import ContactDialog from '../components/ContactDialog.jsx'
import ContactsListView from '../components/ContactsList.jsx'
import EmailLink from '../components/EmailLink.jsx'

const unwrap = (d) => (Array.isArray(d) ? d : (d?.results ?? []))

export const emailValue = (email) =>
    email ? <EmailLink email={email} sx={{ fontSize: '1.2rem', lineHeight: 1.1 }} /> : null

export default function EntityInfoWithContacts({
    id,
    label,
    editTo, // (id) => `/warehouses/${id}/edit`
    entityUrl, // (id) => `/api/stock/${id}/`
    contactsUrl, // (id) => `/api/stock/${id}/contacts/`
    ownerType, // "warehouse" | "carrier"
    ownerId, // Number(id)
    fields, // (entity) => [{ label, value }]
}) {
    const navigate = useNavigate()

    const [entity, setEntity] = useState(null)
    const [contacts, setContacts] = useState([])

    const [loading, setLoading] = useState(true)

    const [dialog, setDialog] = useState({ open: false, mode: 'create', contact: null })
    const closeDialog = () => setDialog((s) => ({ ...s, open: false }))
    const openCreateContact = () => setDialog({ open: true, mode: 'create', contact: null })
    const openEditContact = (contact) => setDialog({ open: true, mode: 'edit', contact })

    const [snack, setSnack] = useState({ open: false, severity: 'success', msg: '' })
    const showSnack = (msg, severity = 'success') => setSnack({ open: true, severity, msg })

    const [confirm, setConfirm] = useState({ open: false, title: '', text: '', onYes: null })
    const openConfirm = ({ title, text, onYes }) => setConfirm({ open: true, title, text, onYes })
    const closeConfirm = () => setConfirm((s) => ({ ...s, open: false }))

    const [deleting, setDeleting] = useState({
        contactIds: new Set(),
        phoneKeySet: new Set(),
    })

    const setDeletingContact = (contactId, isOn) => {
        setDeleting((s) => {
            const next = new Set(s.contactIds)
            if (isOn) next.add(contactId)
            else next.delete(contactId)
            return { ...s, contactIds: next }
        })
    }

    const setDeletingPhone = (contactId, phoneNumber, isOn) => {
        const key = `${contactId}:${phoneNumber}`
        setDeleting((s) => {
            const next = new Set(s.phoneKeySet)
            if (isOn) next.add(key)
            else next.delete(key)
            return { ...s, phoneKeySet: next }
        })
    }

    const isContactDeleting = (contactId) => deleting.contactIds.has(contactId)
    const isPhoneDeleting = (contactId, phoneNumber) => deleting.phoneKeySet.has(`${contactId}:${phoneNumber}`)

    const load = async () => {
        setLoading(true)
        try {
            const [entityRes, contactsRes] = await Promise.all([api.get(entityUrl(id)), api.get(contactsUrl(id))])
            setEntity(entityRes.data)
            setContacts(unwrap(contactsRes.data))
        } catch (e) {
            showSnack(e?.response?.data?.detail || 'Не удалось загрузить данные', 'error')
            setEntity(null)
            setContacts([])
        } finally {
            setLoading(false)
        }
    }

    const onDeleteContact = (contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        openConfirm({
            title: 'Удалить контакт?',
            text: `Контакт "${contact?.firstName ?? ''} ${contact?.lastName ?? ''}". Действие необратимо.`,
            onYes: async () => {
                closeConfirm()

                const prev = contacts
                setContacts((cs) => cs.filter((c) => c.id !== contactId))
                setDeletingContact(contactId, true)

                try {
                    await api.delete(`/api/contacts/${contactId}/`)
                    showSnack('Контакт удалён')
                } catch (e) {
                    setContacts(prev)
                    showSnack(e?.response?.data?.detail || 'Не удалось удалить контакт', 'error')
                } finally {
                    setDeletingContact(contactId, false)
                }
            },
        })
    }

    const onDeletePhone = async (contactId, phoneNumberToDelete) => {
        const contact = contacts.find((c) => c.id === contactId)
        if (!contact) return

        const prev = contacts

        const nextPhones = (contact.phoneNumbers ?? []).filter((p) => p.phoneNumber !== phoneNumberToDelete)
        setContacts((cs) => cs.map((c) => (c.id === contactId ? { ...c, phoneNumbers: nextPhones } : c)))

        setDeletingPhone(contactId, phoneNumberToDelete, true)

        try {
            await api.patch(`/api/contacts/${contactId}/`, { phoneNumbers: nextPhones })
            showSnack('Телефон удалён')
        } catch (e) {
            setContacts(prev)
            showSnack(e?.response?.data?.detail || 'Не удалось удалить телефон', 'error')
        } finally {
            setDeletingPhone(contactId, phoneNumberToDelete, false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const rows = useMemo(() => fields(entity), [entity, fields])

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Card variant="outlined" sx={{ width: '100%', borderRadius: 1 }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                fontSize: '0.9rem',
                            }}
                        >
                            {label}
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(editTo(id))}
                            sx={{ fontWeight: 700, px: 3 }}
                            disabled={!entity}
                        >
                            Изменить
                        </Button>
                    </Box>

                    <Divider />

                    <CardContent sx={{ p: 0 }}>
                        {loading ? (
                            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Stack>
                                {rows.map((item) => (
                                    <Box key={item.label} sx={{ px: 3, py: 2.5 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                display: 'block',
                                                color: 'text.disabled',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                mb: 0.5,
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            {item.label}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            sx={{ color: 'text.primary', fontSize: '1.2rem', lineHeight: 1.1 }}
                                        >
                                            {item.value || '—'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CardContent>
                </Card>

                <ContactsListView
                    contacts={contacts}
                    onAdd={openCreateContact}
                    onEdit={openEditContact}
                    onDelete={onDeleteContact}
                    onDeletePhone={onDeletePhone}
                    isDeletingPhone={isPhoneDeleting}
                    isDeletingContact={isContactDeleting}
                />
            </Stack>

            <ContactDialog
                open={dialog.open}
                mode={dialog.mode}
                ownerType={ownerType}
                ownerId={ownerId}
                initialData={dialog.contact}
                onClose={closeDialog}
                onSaved={async () => {
                    await load()
                    closeDialog()
                }}
            />

            <Dialog open={confirm.open} onClose={closeConfirm}>
                <DialogTitle>{confirm.title}</DialogTitle>
                <DialogContent>{confirm.text}</DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm}>Отмена</Button>
                    <Button color="error" variant="contained" onClick={() => confirm.onYes?.()}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={2500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snack.severity}
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                    variant="filled"
                >
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    )
}
