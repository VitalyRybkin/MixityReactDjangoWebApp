import React, { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import ConstructionIcon from '@mui/icons-material/Construction'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonIcon from '@mui/icons-material/Person'
import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material'

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
    renderEditDialog,
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
    const loadError = entityQuery.isError || contactsQuery.isError
    const missingEntity = !loading && !entity

    const [dialog, setDialog] = useState({
        open: false,
        mode: 'create',
        contact: null,
    })

    const [entityEditOpen, setEntityEditOpen] = useState(false)

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

    const phoneDeletionQueuesRef = useRef(new Map())

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

    const onDeletePhone = (contactId, phoneNumberToDelete) => {
        setDeletingPhone(contactId, phoneNumberToDelete, true)

        // The API replaces the whole phoneNumbers array. Serialize deletes
        // per contact and fetch the newest array immediately before PATCH.
        const previousJob = phoneDeletionQueuesRef.current.get(contactId) ?? Promise.resolve()
        const job = previousJob.catch(() => {}).then(async () => {
            try {
                const { data: latestContact } = await api.get(`/api/contacts/${contactId}/`)
                const phones = latestContact.phoneNumbers ?? []
                const nextPhones = phones.filter((p) => p.phoneNumber !== phoneNumberToDelete)

                if (nextPhones.length !== phones.length) {
                    await api.patch(`/api/contacts/${contactId}/`, { phoneNumbers: nextPhones })
                }
                const refreshed = await contactsQuery.refetch({ throwOnError: true })
                if (refreshed.error) throw refreshed.error
                showSnackbar('Телефон удалён', 'success')
            } catch (error) {
                showSnackbar(error?.response?.data?.detail || 'Не удалось удалить телефон', 'error')
            } finally {
                setDeletingPhone(contactId, phoneNumberToDelete, false)
            }
        })
        phoneDeletionQueuesRef.current.set(contactId, job)
        void job.finally(() => {
            if (phoneDeletionQueuesRef.current.get(contactId) === job) {
                phoneDeletionQueuesRef.current.delete(contactId)
            }
        })
    }
    const rows = entity && !loadError ? fields(entity) : []

    if (loadError || missingEntity) {
        // A network/5xx failure can leave entity empty; only an actual
        // 404 (or a successful empty response) should say "not found".
        const notFound = entityQuery.error?.response?.status === 404 ||
            (!entityQuery.isError && missingEntity)
        const message = notFound
            ? 'Запись не найдена.'
            : entityQuery.isError
              ? 'Не удалось загрузить данные записи.'
              : 'Не удалось загрузить контакты.'

        return (
            <Box sx={sx.page}>
                <AppBreadcrumbs />
                <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>
                {!notFound && (
                    <Button
                        sx={{ mt: 2 }}
                        variant="outlined"
                        disabled={entityQuery.isFetching || contactsQuery.isFetching}
                        onClick={() => {
                            if (entityQuery.isError) void entityQuery.refetch()
                            if (contactsQuery.isError) void contactsQuery.refetch()
                        }}
                    >
                        Повторить
                    </Button>
                )}
            </Box>
        )
    }

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
                                disabled={loading || !entity}
                                onClick={(event) => {
                                    if (renderEditDialog) {
                                        event.currentTarget.blur()
                                        setEntityEditOpen(true)
                                        return
                                    }

                                    navigate(editTo(id), {
                                        state: { from: location.pathname },
                                    })
                                }}
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

                {!loading && (
                    <ContactsListView
                        contacts={contacts}
                        onAdd={openCreateContact}
                        onEdit={openEditContact}
                        onDelete={onDeleteContact}
                        onDeletePhone={onDeletePhone}
                        isDeletingPhone={isPhoneDeleting}
                        isDeletingContact={isContactDeleting}
                    />
                )}
            </Stack>

            {renderEditDialog?.({
                open: entityEditOpen,
                entity,
                onClose: () => setEntityEditOpen(false),
                onSaved: async () => {
                    await entityQuery.refetch()
                    setEntityEditOpen(false)
                    showSnackbar('Изменения сохранены', 'success')
                },
            })}

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
