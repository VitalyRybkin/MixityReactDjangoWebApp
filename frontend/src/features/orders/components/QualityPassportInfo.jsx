import { useState } from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'

import RenewAction from '../../../components/ui/buttons/RenewAction.jsx'
import { useGetQualityPassportState } from '../utils/qualityPassports.queries.js'

import NewQualityPassportDialog from './NewQualityPassportDialog.jsx'
import OrderPassportPreviewAction from './OrderPassportPreviewAction.jsx'
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

    const displayedPassport = showPrepared ? { ...passport, ...pendingPassport } : passport
    const issued = safeQuantity(displayedPassport.quantity)
    const used = safeQuantity(data.used_quantity)
    const projectedUsed = data.projected_used_quantity == null ? used : safeQuantity(data.projected_used_quantity)
    const isProjection = Math.abs(projectedUsed - used) > 0.000001
    const orderQuantityValue = Number(String(quantity ?? '').replace(',', '.'))
    const rowQuantityTons = Number.isFinite(orderQuantityValue)
        ? Math.max(
              0,
              product?.is_piece_based
                  ? (orderQuantityValue * Number(product?.product_unit?.value || 0)) / 1000
                  : orderQuantityValue,
          )
        : 0
    const displayedUsed = showPrepared ? rowQuantityTons : isProjection ? projectedUsed : used
    const displayedRemaining = showPrepared
        ? issued - rowQuantityTons
        : isProjection
          ? issued - projectedUsed
          : Number(data.remaining_quantity ?? issued - used)
    const canRenew = !readOnly && !isHistorical && !isDraft && data.can_issue_new_passport !== false

    return (
        <Box sx={{ mt: 0.75, mb: 0.5, px: 1, maxWidth: 900 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2.5, rowGap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {showPrepared ? 'Новый паспорт № ' : 'Паспорт № '}
                    {displayedPassport.number}
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                <QualityPassportUsageBar issued={issued} used={displayedUsed} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                    <OrderPassportPreviewAction
                        productId={productId}
                        quantity={quantity}
                        orderId={orderId}
                        targetStatus={targetStatus}
                        pendingPassport={pendingPassport}
                    />
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
                <Typography
                    variant="caption"
                    color={isDraft ? 'error.main' : 'primary.main'}
                    sx={{ display: 'block', mt: 0.5 }}
                >
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
        </Box>
    )
}
