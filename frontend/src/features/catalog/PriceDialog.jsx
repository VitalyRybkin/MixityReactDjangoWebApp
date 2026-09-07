import React, { useEffect } from 'react'

import { Dialog, DialogContent, DialogTitle, Divider, Stack, TextField, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import FormActions from '../../components/ui/FormActions.jsx'
import DeleteAction from '../../components/ui/buttons/DeleteAction.jsx'
import ConfirmDialog from '../../components/ui/feedback/ConfirmDialog.jsx'
import useConfirm from '../../hooks/useConfirm.js'
import { useFormLogic } from '../../hooks/useEntityForm.js'

import { priceDialogSx as sx } from './PriceDialog.styles.js'

const getToday = () => {
    const now = new Date()

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export default function PriceDialog({
    open,
    selection,
    price = null,
    createMutation,
    updateMutation,
    deleteMutation,
    onClose,
    onSuccess,
    onDeleted,
    onError,
}) {
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()

    const isEdit = Boolean(price)
    const isSale = selection?.type === 'sale'

    const { form, setForm, onChange, onSubmit } = useFormLogic({
        isEdit,
        id: price?.id,

        emptyForm: {
            date: getToday(),
            value: '',
        },

        createMutation,
        updateMutation,

        toPayload: (form) => ({
            date: form.date,

            ...(isSale
                ? {
                      sale_price: form.value,
                  }
                : {
                      purchase_price: form.value,
                  }),

            ...(!isEdit && isSale
                ? {
                      customer: selection.entity.id,
                  }
                : {}),

            ...(!isEdit && !isSale
                ? {
                      warehouse: selection.entity.id,
                  }
                : {}),
        }),

        onSuccess,
        onError,
    })

    useEffect(() => {
        if (!open) {
            return
        }

        setForm({
            date: price?.date ?? getToday(),

            value: price ? (isSale ? price.sale_price : price.purchase_price) : '',
        })
    }, [open, price, isSale, setForm])

    if (!selection) {
        return null
    }

    const saving = createMutation.isPending || updateMutation.isPending

    const deleting = deleteMutation.isPending

    const busy = saving || deleting

    const handleDelete = () => {
        if (!price?.id) {
            return
        }

        askConfirm({
            title: 'Удалить цену?',
            text: 'Вы действительно хотите удалить эту запись из истории цен?',
            confirmText: 'Удалить',
            cancelText: 'Отмена',
            confirmColor: 'error',

            onConfirm: async () => {
                try {
                    await deleteMutation.mutateAsync(price.id)

                    onDeleted()
                } catch (error) {
                    onError?.('Не удалось удалить цену')
                }
            },
        })
    }

    return (
        <>
            <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
                <form onSubmit={onSubmit}>
                    <DialogTitle sx={sx.title}>{isEdit ? 'Изменить цену' : 'Добавить цену'}</DialogTitle>

                    <Divider sx={sx.divider} />

                    <DialogContent sx={sx.content}>
                        <Stack sx={sx.stack}>
                            <Typography sx={sx.entityName}>{selection.entity.name}</Typography>

                            <TextField
                                label="Дата"
                                type="date"
                                value={form.date}
                                onChange={onChange('date')}
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
                                type="number"
                                value={form.value}
                                onChange={onChange('value')}
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
                        </Stack>
                    </DialogContent>

                    <Stack direction="row" alignItems="center" sx={sx.actions}>
                        {isEdit && <DeleteAction onClick={handleDelete} disabled={busy} />}

                        <FormActions
                            saving={saving}
                            onCancel={onClose}
                            submitLabel={isEdit ? 'Сохранить' : 'Добавить'}
                            cancelFirst
                            sx={sx.formActions}
                        />
                    </Stack>
                </form>
            </Dialog>

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
        </>
    )
}
