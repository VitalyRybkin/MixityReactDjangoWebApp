import { useState } from 'react'

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import RenewAction from '../../../components/ui/buttons/RenewAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'

import { useGetQualityPassportState } from '../utils/qualityPassports.queries.js'

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

export default function QualityPassportInfo({ productId, quantity, orderId, targetStatus }) {
    const [viewOpen, setViewOpen] = useState(false)

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
    const issued = safeQuantity(passport.quantity)
    const used = safeQuantity(data.used_quantity)
    const projectedUsed = data.projected_used_quantity == null ? used : safeQuantity(data.projected_used_quantity)
    const isProjection = Math.abs(projectedUsed - used) > 0.000001
    const displayedUsed = isProjection ? projectedUsed : used
    const displayedRemaining = isProjection
        ? issued - projectedUsed
        : Number(data.remaining_quantity ?? issued - used)
    const isHistorical = data.is_latest === false
    const projectedExceeded = Math.max(
        safeQuantity(data.projected_exceeded_quantity),
        isProjection ? Math.max(0, displayedUsed - issued) : 0,
    )

    return (
        <Box sx={{ mt: 0.75, mb: 0.5, px: 1, maxWidth: 900 }}>
            {/* Первая строка: реквизиты и остаток (фактический или с учётом формы). */}
            <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2.5, rowGap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Паспорт № {passport.number}
                    {isHistorical ? ' (исторический)' : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Дата: {formatPassportDate(passport.issue_date)}
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
                    {!isHistorical && (
                        <RenewAction
                            size="small"
                            disabled
                            title="Выпуск нового паспорта подключим на следующем этапе"
                        />
                    )}
                </Box>
            </Box>

            {!isHistorical && projectedExceeded > 0 && (
                <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                    Прогноз превышения: {formatPassportTons(projectedExceeded)}. Для этой позиции потребуется новый паспорт.
                </Typography>
            )}

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Паспорт качества № {passport.number}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 1, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Дата выдачи</Typography>
                        <Typography variant="body2">{formatPassportDate(passport.issue_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Номер партии</Typography>
                        <Typography variant="body2">{passport.batch_number || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">Дата изготовления</Typography>
                        <Typography variant="body2">{formatPassportDate(passport.production_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Количество</Typography>
                        <Typography variant="body2">{formatPassportTons(issued)}</Typography>
                        <Typography variant="body2" color="text.secondary">Использовано</Typography>
                        <Typography variant="body2">{formatPassportTons(used)}</Typography>
                        <Typography variant="body2" color="text.secondary">Остаток</Typography>
                        <Typography variant="body2">{formatPassportTons(data.remaining_quantity ?? issued - used)}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={() => setViewOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
