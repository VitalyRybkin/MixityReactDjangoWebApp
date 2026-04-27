import { Autocomplete, Box, TextField, Typography } from '@mui/material'

import { fieldsetStyles } from '../order.form.constants.js'

export default function OrderCustomerFields({ form, setForm, orderResources }) {
    return (
        <Box component="fieldset" sx={fieldsetStyles}>
            <Typography
                component="legend"
                variant="caption"
                sx={{ px: 1, color: 'text.secondary', fontWeight: 'medium' }}
            >
                Данные заказчика:
            </Typography>

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
            />

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
            />

            <Autocomplete
                multiple
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
            />
        </Box>
    )
}
