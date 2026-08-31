import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import ConstructionIcon from '@mui/icons-material/Construction'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonIcon from '@mui/icons-material/Person'
import { Box, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import { useQuery } from '@tanstack/react-query'

import api from '../api.js'
import useConfirm from '../hooks/useConfirm.js'
import useSnackbar from '../hooks/useSnackbar.js'

import AppBreadcrumbs from './AppBreadcrumbs.jsx'
import ContactCreateUpdate from './ContactCreateUpdate.jsx'
import ContactsListView from './ContactsList.jsx'
import { objectDetailWithContactListSx as sx } from './ObjectDetailWithContactList.styles.js'
import EditAction from './ui/buttons/EditAction.jsx'
import AppSnackbar from './ui/feedback/AppSnackbar.jsx'
import ConfirmDialog from './ui/feedback/ConfirmDialog.jsx'

export default function ObjectDetailWithContactList({
    id,
    label,
    editTo,
    entityUrl,
    contactsUrl,
    ownerType,
    ownerId,
    fields,
}) {
    const navigate = useNavigate()
    const location = useLocation()

    const entityQuery = useQuery({
        queryKey: ['object-detail', entityUrl(id)],
        queryFn: async () => {
            const res = await api.get(entityUrl(id))
            return res.data
        },
    })

    const contactsQuery = useQuery({
        queryKey: ['object-contacts', contactsUrl(id)],
        queryFn: async () => {
            const res = await api.get(contactsUrl(id))
            return Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
        },
    })

    const entity = entityQuery.data ?? null
    const contacts = contactsQuery.data ?? []
    const loading = entityQuery.isPending || contactsQuery.isPending

    const [dialog, setDialog] = useState({
        open: false,
        mode: 'create',
        contact: null,
    })

    const closeDialog = () => setDialog((s) => ({ ...s, open: false }))
    const openCreateContact = () =>
        setDialog({
            open: true,
            mode: 'create',
            contact: null,
        })

    const openEditContact = (contact) =>
        setDialog({
            open: true,
            mode: 'edit',
            contact,
        })

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const { snack, showSnackbar, closeSnackbar } = useSnackbar()

    const [deleting, setDeleting] = useState({
        contactIds: new Set(),
        phoneKeySet: new Set(),
    })

    const setDeletingContact = (contactId, isOn) => {
        setDeleting((s) => {
            const next = new Set(s.contactIds)

            if (isOn) next.add(contactId)
            else next.delete(contactId)

            return {
                ...s,
                contactIds: next,
            }
        })
    }

    const setDeletingPhone = (contactId, phoneNumber, isOn) => {
        const key = `${contactId}:${phoneNumber}`

        setDeleting((s) => {
            const next = new Set(s.phoneKeySet)

            if (isOn) next.add(key)
            else next.delete(key)

            return {
                ...s,
                phoneKeySet: next,
            }
        })
    }

    const isContactDeleting = (contactId) => deleting.contactIds.has(contactId)

    const isPhoneDeleting = (contactId, phoneNumber) => deleting.phoneKeySet.has(`${contactId}:${phoneNumber}`)

    const refetchAll = async () => {
        await Promise.all([entityQuery.refetch(), contactsQuery.refetch()])
    }

    const onDeleteContact = (contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        const fullName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ')

        askConfirm({
            title: 'Удалить контакт?',
            text: `Вы действительно хотите удалить "${fullName}"?`,
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmColor: 'error',
            onConfirm: async () => {
                setDeletingContact(contactId, true)

                try {
                    await api.delete(`/api/contacts/${contactId}/`)
                    await contactsQuery.refetch()
                    showSnackbar('Контакт удалён', 'success')
                } catch (e) {
                    showSnackbar(e?.response?.data?.detail || 'Не удалось удалить контакт', 'error')
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
            await api.patch(`/api/contacts/${contactId}/`, {
                phoneNumbers: nextPhones,
            })

            await contactsQuery.refetch()
            showSnackbar('Телефон удалён', 'success')
        } catch (e) {
            showSnackbar(e?.response?.data?.detail || 'Не удалось удалить телефон', 'error')
        } finally {
            setDeletingPhone(contactId, phoneNumberToDelete, false)
        }
    }

    const rows = fields(entity)

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <Stack spacing={2}>
                <Card variant="outlined" sx={sx.card}>
                    <Box sx={sx.header}>
                        <Typography variant="subtitle1" sx={sx.title}>
                            {label}
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <EditAction
                                onClick={() =>
                                    navigate(editTo(id), {
                                        state: {
                                            from: location.pathname,
                                        },
                                    })
                                }
                                icon={<EditIcon fontSize="small" />}
                            />

                            {ownerType === 'carrier' && entity && (
                                <EditAction
                                    title="Водители"
                                    onClick={() =>
                                        navigate(editTo(id).replace('edit', 'drivers'), {
                                            state: { entity },
                                        })
                                    }
                                    icon={<PersonIcon fontSize="small" />}
                                />
                            )}

                            {ownerType === 'carrier' && entity && (
                                <EditAction
                                    title="Автотранспорт"
                                    onClick={() =>
                                        navigate(editTo(id).replace('edit', 'trucks'), {
                                            state: { entity },
                                        })
                                    }
                                    icon={<LocalShippingIcon fontSize="small" />}
                                />
                            )}

                            {ownerType === 'customer' && entity && (
                                <EditAction
                                    title="Объекты"
                                    onClick={() =>
                                        navigate(editTo(id).replace('edit', 'construction_objects'), {
                                            state: { entity },
                                        })
                                    }
                                    icon={<ConstructionIcon fontSize="small" />}
                                />
                            )}
                        </Stack>
                    </Box>

                    <Divider />

                    <CardContent sx={sx.cardContent}>
                        {loading ? (
                            <Box sx={sx.loading}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Stack>
                                {rows.map((item) => {
                                    const isEmpty = item.value === null || item.value === undefined || item.value === ''

                                    const isNode = React.isValidElement(item.value)

                                    return (
                                        <Box key={item.label} sx={sx.row}>
                                            <Typography variant="body2" sx={sx.fieldLabel}>
                                                {item.label}
                                            </Typography>

                                            {isNode ? (
                                                item.value
                                            ) : (
                                                <Typography variant="h6" sx={sx.fieldValue}>
                                                    {isEmpty ? '—' : item.value}
                                                </Typography>
                                            )}
                                        </Box>
                                    )
                                })}
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

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                text={confirm.text}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                confirmColor={confirm.confirmColor}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </Box>
    )
}
