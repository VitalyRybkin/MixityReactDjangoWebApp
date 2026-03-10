import React, { useMemo, useState } from 'react'
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
import { useQuery } from '@tanstack/react-query'

import api from '../../api.js'
import ContactCreateUpdate from '../../components/ContactCreateUpdate.jsx'
import ContactsListView from '../../components/ContactsList.jsx'
import EditAction from '../../components/ui/buttons/EditAction.jsx'
import {useCarrierContacts} from "../../features/logistic/carriers/carriers.queries.js";

// const unwrap = (d) => (Array.isArray(d) ? d : (d?.results ?? []))

export default function ObjectDetailWithContactList({
                                                        id,
                                                        label,
                                                        editTo,
                                                        entityUrl,
                                                        // contactsUrl,
                                                        ownerType,
                                                        ownerId,
                                                        fields,
                                                    }) {
    const navigate = useNavigate()

    const entityQuery = useQuery({
        queryKey: ['object-detail', entityUrl(id)],
        queryFn: async () => {
            const res = await api.get(entityUrl(id))
            return res.data
        },
    })

    // const contactsQuery = useQuery({
    //     queryKey: ['object-contacts', contactsUrl(id)],
    //     queryFn: async () => {
    //         const res = await api.get(contactsUrl(id))
    //         return unwrap(res.data)
    //     },
    // })

    const contactsQuery = useCarrierContacts(id)

    const entity = entityQuery.data ?? null
    const contacts = contactsQuery.data ?? []
    const loading = entityQuery.isPending || contactsQuery.isPending

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

    const refetchAll = async () => {
        await Promise.all([entityQuery.refetch(), contactsQuery.refetch()])
    }

    const onDeleteContact = (contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        openConfirm({
            title: 'Удалить контакт?',
            text: `"${contact?.firstName ?? ''} ${contact?.lastName ?? ''}". Действие необратимо.`,
            onYes: async () => {
                closeConfirm()
                setDeletingContact(contactId, true)

                try {
                    await api.delete(`/api/contacts/${contactId}/`)
                    await contactsQuery.refetch()
                    showSnack('Контакт удалён')
                } catch (e) {
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

        const nextPhones = (contact.phoneNumbers ?? []).filter((p) => p.phoneNumber !== phoneNumberToDelete)

        setDeletingPhone(contactId, phoneNumberToDelete, true)

        try {
            await api.patch(`/api/contacts/${contactId}/`, { phoneNumbers: nextPhones })
            await contactsQuery.refetch()
            showSnack('Телефон удалён')
        } catch (e) {
            showSnack(e?.response?.data?.detail || 'Не удалось удалить телефон', 'error')
        } finally {
            setDeletingPhone(contactId, phoneNumberToDelete, false)
        }
    }

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
                        <EditAction
                            title="Изменить"
                            color="primary"
                            onClick={() => navigate(editTo(id))}
                            icon={<EditIcon fontSize="small" />}
                        />
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

            <ContactCreateUpdate
                open={dialog.open}
                mode={dialog.mode}
                ownerType={ownerType}
                ownerId={ownerId}
                initialData={dialog.contact}
                onClose={closeDialog}
                onSaved={async () => {
                    await refetchAll()
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