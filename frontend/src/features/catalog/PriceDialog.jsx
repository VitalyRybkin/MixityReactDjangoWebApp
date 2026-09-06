import React, { useEffect, useState } from 'react'

import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { priceDialogSx as sx } from './PriceDialog.styles.js'

const getToday = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export default function PriceDialog({ open, selection, price = null, loading = false, error = null, onClose, onSave }) {
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

    const [date, setDate] = useState(getToday())
    const [value, setValue] = useState('')

    const isEdit = Boolean(price)
    const isSale = selection?.type === 'sale'

    useEffect(() => {
        if (!open) {
            return
        }

        setDate(price?.date ?? getToday())

        setValue(price ? (isSale ? price.sale_price : price.purchase_price) : '')
    }, [open, price, isSale])

    const handleSubmit = (event) => {
        event.preventDefault()

        if (!date || !value) {
            return
        }

        onSave({
            date,
            value,
        })
    }

    if (!selection) {
        return null
    }

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={sx.title}>{isEdit ? 'Изменить цену' : 'Добавить цену'}</DialogTitle>

                <Divider sx={sx.divider} />

                <DialogContent sx={sx.content}>
                    <Stack sx={sx.stack}>
                        <Typography sx={sx.entityName}>{selection.entity.name}</Typography>

                        <TextField
                            label="Дата"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            fullWidth
                            required
                            sx={sx.field}
                        />

                        <TextField
                            label={isSale ? 'Цена продажи' : 'Закупочная цена'}
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            type="number"
                            fullWidth
                            required
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    step: '0.01',
                                },
                            }}
                            sx={sx.field}
                        />

                        {error && <Alert severity="error">Не удалось сохранить цену</Alert>}
                    </Stack>
                </DialogContent>

                <DialogActions sx={sx.actions}>
                    <Button onClick={onClose} disabled={loading}>
                        Отмена
                    </Button>

                    <Button type="submit" variant="contained" loading={loading}>
                        {isEdit ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
