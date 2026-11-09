import { useState } from 'react'

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import RenewAction from '../../../components/ui/buttons/RenewAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'

import { useGetQualityPassportState } from '../utils/qualityPassports.queries.js'

import NewQualityPassportDialog from './NewQualityPassportDialog.jsx'
import QualityPassportUsageBar, { formatPassportTons } from './QualityPassportUsageBar.jsx'

const safeQuantity = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

const formatPassportDate = (value) => {
    if (!value) return '—'

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match ? `${match[3]}.${match[2]}.${match[1]}` : String(value)
}

export default function QualityPassportInfo({
    productId,
    quantity,
    product,
    orderId,
    targetStatus,
    deliveryDate = null,
    readOnly = false,
    pendingPassport = null,
    onPassportChange,
}) {
    const [viewOpen, setViewOpen] = useState(false)
    const [renewOpen, setRenewOpen] = useState(false)

    const { data, isPending, isError } = useGetQualityPassportState({
        productId,
        quantity,
        orderId,
        targetStatus,
    })

    if (isPending) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, px: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                    Загружаем паспорт качества…
                </Typography>
            </Box>
        )
    }

    if (isError) {
        return (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, px: 1 }}>
                Не удалось загрузить данные паспорта качества.
            </Typography>
        )
    }

    if (!data?.passport) {
        return (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, px: 1 }}>
                Паспорт качества не выпущен.
            </Typography>
        )
    }

    const passport = data.passport
    const isHistorical = data.is_latest === false
    const isDraft = targetStatus === 'draft'
    const showPrepared = Boolean(pendingPassport) && !isDraft

    // До сохранения в БД показываем реквизиты подготовленного паспорта.
    // Он предназначен только для этой позиции, поэтому расход равен её весу.
    const displayedPassport = showPrepared ? { ...passport, ...pendingPassport } : passport
    const issued = safeQuantity(displayedPassport.quantity)
    const used = safeQuantity(data.used_quantity)
    const projectedUsed = data.projected_used_quantity == null ? used : safeQuantity(data.projected_used_quantity)
    const isProjection = Math.abs(projectedUsed - used) > 0.000001
    const orderQuantityValue = Number(String(quantity ?? '').replace(',', '.'))
    const rowQuantityTons = Number.isFinite(orderQuantityValue)
        ? Math.max(0, product?.is_piece_based
            ? (orderQuantityValue * Number(product?.product_unit?.value || 0)) / 1000
            : orderQuantityValue)
        : 0
    const displayedUsed = showPrepared ? rowQuantityTons : (isProjection ? projectedUsed : used)
    const displayedRemaining = showPrepared
        ? issued - rowQuantityTons
        : (isProjection ? issued - projectedUsed : Number(data.remaining_quantity ?? issued - used))
    const canRenew = !readOnly && !isHistorical && !isDraft && data.can_issue_new_passport !== false

    return (
        <Box sx={{ mt: 0.75, mb: 0.5, px: 1, maxWidth: 900 }}>
            {/* Первая строка: реквизиты и остаток (фактический или с учётом формы). */}
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2.5, rowGap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {showPrepared ? 'Новый паспорт № ' : 'Паспорт № '}{displayedPassport.number}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Дата: {formatPassportDate(displayedPassport.issue_date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Количество: {formatPassportTons(issued)}
                </Typography>
                <Typography
                    variant="caption"
                    color={displayedRemaining < 0 ? 'error.main' : 'text.secondary'}
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    {displayedRemaining < 0 ? 'Перерасход' : 'Остаток'}:{' '}
                    {formatPassportTons(Math.abs(displayedRemaining))}
                </Typography>
            </Box>

            {/* Вторая строка: шкала и действия. «Обновить» = выпуск нового паспорта, не refetch. */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                <QualityPassportUsageBar issued={issued} used={displayedUsed} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                    <ViewAction size="small" onClick={() => setViewOpen(true)} />
                    {!readOnly && !isHistorical && (
                        <RenewAction
                            size="small"
                            disabled={!pendingPassport && !canRenew}
                            title={pendingPassport ? 'Изменить новый паспорт' : 'Создать паспорт'}
                            aria-label={pendingPassport ? 'Изменить новый паспорт' : 'Создать паспорт'}
                            onClick={() => setRenewOpen(true)}
                        />
                    )}
                </Box>
            </Box>

            {pendingPassport && (
                <Typography variant="caption" color={isDraft ? 'error.main' : 'primary.main'} sx={{ display: 'block', mt: 0.5 }}>
                    {isDraft
                        ? 'Для создания нового паспорта измените статус заявки с «Черновик».'
                        : 'Будет создан при сохранении заявки.'}
                </Typography>
            )}

            {renewOpen && (
                <NewQualityPassportDialog
                    open
                    currentPassport={passport}
                    initialValue={pendingPassport}
                    product={product}
                    orderQuantity={quantity}
                    deliveryDate={deliveryDate}
                    isDraft={isDraft}
                    onClose={() => setRenewOpen(false)}
                    onConfirm={(details) => {
                        onPassportChange?.(details)
                        setRenewOpen(false)
                    }}
                    onRemove={() => {
                        onPassportChange?.(undefined)
                        setRenewOpen(false)
                    }}
                />
            )}

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{showPrepared ? 'Подготовленный паспорт № ' : 'Паспорт качества № '}{displayedPassport.number}</DialogTitle>
                <DialogContent>
                    {showPrepared && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Паспорт пока не выпущен. Он будет создан после сохранения заявки.
                        </Typography>
                    )}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Дата выдачи</Typography>
                        <Typography variant="body2">{formatPassportDate(displayedPassport.issue_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Номер партии</Typography>
                        <Typography variant="body2">{displayedPassport.batch_number || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">Дата изготовления</Typography>
                        <Typography variant="body2">{formatPassportDate(displayedPassport.production_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Количество</Typography>
                        <Typography variant="body2">{formatPassportTons(issued)}</Typography>
                        <Typography variant="body2" color="text.secondary">Использовано</Typography>
                        <Typography variant="body2">{formatPassportTons(showPrepared ? displayedUsed : used)}</Typography>
                        <Typography variant="body2" color="text.secondary">Остаток</Typography>
                        <Typography variant="body2">{formatPassportTons(showPrepared ? displayedRemaining : (data.remaining_quantity ?? issued - used))}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={() => setViewOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
