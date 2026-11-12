import { useState } from 'react'

import { Box, Button, ButtonBase, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

import RenewAction from '../../../components/ui/buttons/RenewAction.jsx'
import CatalogPassportActions from './CatalogPassportActions.jsx'
import QualityPassportUsageBar, { formatPassportTons } from '../../orders/components/QualityPassportUsageBar.jsx'
import { useGetQualityPassportState } from '../../orders/utils/qualityPassports.queries.js'

const formatDate = (value) => {
    const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match ? `${match[3]}.${match[2]}.${match[1]}` : '—'
}

const toQuantity = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

export default function CatalogPassportStatus({ productId, productName }) {
    const [viewOpen, setViewOpen] = useState(false)

    const { data, isPending, isError } = useGetQualityPassportState({
        productId,
        quantity: '',
        orderId: null,
        targetStatus: 'draft',
    })

    if (isPending) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 48 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">Загрузка паспорта…</Typography>
            </Box>
        )
    }

    if (isError) {
        return <Typography variant="caption" color="error.light">Не удалось загрузить паспорт качества.</Typography>
    }

    const passport = data?.passport

    if (!passport) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 48 }}>
                <Typography variant="caption" color="text.secondary">Паспорт качества не выпущен</Typography>
                <RenewAction
                    disabled
                    size="small"
                    title="Выпуск паспорта из каталога пока не подключён"
                    aria-label="Выпуск паспорта из каталога пока не подключён"
                />
            </Box>
        )
    }

    const issued = toQuantity(passport.quantity)
    const used = toQuantity(data.used_quantity)
    const remaining = toQuantity(data.remaining_quantity ?? issued - used)

    return (
        <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.25, alignItems: 'center' }}>
                <ButtonBase
                    type="button"
                    onClick={() => setViewOpen(true)}
                    aria-label={`Сведения о паспорте качества № ${passport.number}`}
                    sx={{
                        borderRadius: 0.5,
                        textAlign: 'left',
                        '&:hover': { textDecoration: 'underline' },
                        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Паспорт № {passport.number}
                    </Typography>
                </ButtonBase>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    от {formatDate(passport.issue_date)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Количество: {formatPassportTons(issued)}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{ color: remaining < 0 ? 'error.light' : 'text.secondary', whiteSpace: 'nowrap' }}
                >
                    {remaining < 0 ? 'Перерасход' : 'Остаток'}: {formatPassportTons(Math.abs(remaining))}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <QualityPassportUsageBar issued={issued} used={used} />
                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                    <CatalogPassportActions passportId={passport.id} passportSummary={passport} productName={productName} />
                    <RenewAction
                        size="small"
                        disabled
                        title="Выпуск нового паспорта доступен при сохранении заявки"
                        aria-label="Выпуск нового паспорта доступен при сохранении заявки"
                    />
                </Box>
            </Box>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Паспорт качества № {passport.number}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 1.5, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">Дата паспорта</Typography>
                        <Typography variant="body2">{formatDate(passport.issue_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Номер партии</Typography>
                        <Typography variant="body2">{passport.batch_number || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">Дата изготовления</Typography>
                        <Typography variant="body2">{formatDate(passport.production_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">Количество</Typography>
                        <Typography variant="body2">{formatPassportTons(issued)}</Typography>
                        <Typography variant="body2" color="text.secondary">Использовано</Typography>
                        <Typography variant="body2">{formatPassportTons(used)}</Typography>
                        <Typography variant="body2" color="text.secondary">Остаток</Typography>
                        <Typography variant="body2">{formatPassportTons(remaining)}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={() => setViewOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
