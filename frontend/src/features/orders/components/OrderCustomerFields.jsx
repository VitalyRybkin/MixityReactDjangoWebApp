import { useState } from 'react'

import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material'

import ContactCreateUpdate from '../../../components/ContactCreateUpdate.jsx'
import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import CustomerDialog from '../../customers/CustomerDialog.jsx'
import CustomerObjectDialog from '../../customers/CustomerObjectDialog.jsx'
import { fieldsetStyles } from '../utils/order.form.constants.js'

export default function OrderCustomerFields({ form, setForm, orderResources, refetchOrderResources }) {
    const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
    const [objectDialogOpen, setObjectDialogOpen] = useState(false)
    const [contactDialogOpen, setContactDialogOpen] = useState(false)

    const customerId = form.customer?.id ?? null

    const refetchCustomer = async (id) => {
        const { data } = await refetchOrderResources()

        return data?.customers?.find((customer) => Number(customer.id) === Number(id)) ?? null
    }

    const handleCustomerSaved = async (createdCustomer) => {
        const refreshedCustomer = await refetchCustomer(createdCustomer.id)

        setForm((prev) => ({
            ...prev,
            customer: refreshedCustomer ?? createdCustomer,
            customer_object: null,
            contacts: [],
        }))

        setCustomerDialogOpen(false)
    }

    const handleObjectSaved = async (createdObject) => {
        const refreshedCustomer = await refetchCustomer(customerId)

        const selectedObject =
            refreshedCustomer?.customer_objects?.find((item) => Number(item.id) === Number(createdObject.id)) ??
            createdObject

        setForm((prev) => ({
            ...prev,
            customer: refreshedCustomer ?? prev.customer,
            customer_object: selectedObject,
        }))

        setObjectDialogOpen(false)
    }

    const handleContactSaved = async (createdContact) => {
        const refreshedCustomer = await refetchCustomer(customerId)

        setForm((prev) => {
            const selectedIds = new Set((prev.contacts ?? []).map((contact) => Number(contact.id)))

            if (createdContact?.id) {
                selectedIds.add(Number(createdContact.id))
            }

            let contacts = (refreshedCustomer?.contacts ?? []).filter((contact) => selectedIds.has(Number(contact.id)))

            if (createdContact && !contacts.some((contact) => Number(contact.id) === Number(createdContact.id))) {
                contacts = [...contacts, createdContact]
            }

            return {
                ...prev,
                customer: refreshedCustomer ?? prev.customer,
                contacts,
            }
        })

        setContactDialogOpen(false)
    }

    return (
        <>
            <Box component="fieldset" sx={fieldsetStyles}>
                <Typography
                    component="legend"
                    variant="caption"
                    sx={{
                        px: 1,
                        color: 'text.secondary',
                        fontWeight: 'medium',
                    }}
                >
                    Данные заказчика:
                </Typography>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Autocomplete
                        size="small"
                        options={orderResources.customers || []}
                        getOptionLabel={(option) => option?.name || ''}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={form.customer || null}
                        onChange={(event, newValue) => {
                            setForm((prev) => ({
                                ...prev,
                                customer: newValue,
                                customer_object: null,
                                contacts: [],
                            }))
                        }}
                        renderInput={(params) => <TextField {...params} label="Заказчик" />}
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить заказчика"
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setCustomerDialogOpen(true)
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Autocomplete
                        size="small"
                        options={form.customer?.customer_objects || []}
                        getOptionLabel={(option) => (option ? `${option.name} [ ${option.address} ]` : '')}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={form.customer_object || null}
                        onChange={(event, newValue) => {
                            setForm((prev) => ({
                                ...prev,
                                customer_object: newValue,
                            }))
                        }}
                        disabled={!form.customer}
                        renderInput={(params) => <TextField {...params} label="Объект / Адрес" />}
                        noOptionsText="Нет объектов для этого заказчика"
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить объект"
                        disabled={!form.customer}
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setObjectDialogOpen(true)
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Autocomplete
                        multiple
                        size="small"
                        options={form.customer?.contacts || []}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={form.contacts || []}
                        onChange={(event, newValue) => {
                            setForm((prev) => ({
                                ...prev,
                                contacts: newValue,
                            }))
                        }}
                        disabled={!form.customer}
                        getOptionLabel={(option) => {
                            if (!option || typeof option !== 'object') return ''

                            const name = `${option.firstName || ''} ${option.lastName || ''}`.trim()

                            const phones = option.phoneNumbers?.map((phone) => phone.phoneNumber).join(', ') || ''

                            return `${name}${phones ? ` - [ ${phones} ]` : ''}`.trim() || 'Без имени'
                        }}
                        renderInput={(params) => <TextField {...params} label="Контакты заказчика" />}
                        noOptionsText="Нет контактов для этого заказчика"
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить контакт"
                        disabled={!form.customer}
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setContactDialogOpen(true)
                        }}
                    />
                </Stack>
            </Box>

            <CustomerDialog
                open={customerDialogOpen}
                mode="create"
                onClose={() => setCustomerDialogOpen(false)}
                onSaved={handleCustomerSaved}
            />

            <CustomerObjectDialog
                open={objectDialogOpen}
                mode="create"
                customerId={customerId}
                onClose={() => setObjectDialogOpen(false)}
                onSaved={handleObjectSaved}
            />

            <ContactCreateUpdate
                open={contactDialogOpen}
                mode="create"
                ownerType="customer"
                ownerId={customerId}
                initialData={null}
                onClose={() => setContactDialogOpen(false)}
                onSaved={handleContactSaved}
            />
        </>
    )
}
