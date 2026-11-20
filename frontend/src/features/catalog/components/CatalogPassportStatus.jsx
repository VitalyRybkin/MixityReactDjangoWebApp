import { useState } from 'react'

import {
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material'

import { useQueryClient } from '@tanstack/react-query'

import RenewAction from '../../../components/ui/buttons/RenewAction.jsx'
import AppSnackbar from '../../../components/ui/feedback/AppSnackbar.jsx'
import { useAuth } from '../../../pages/auth/context/useAuth.js'
import { PERMISSIONS } from '../../../pages/auth/permissions.js'
import { formatBatchNumber } from '../../../utils/qualityPassportNumbers.js'
import QualityPassportUsageBar from '../../orders/components/QualityPassportUsageBar.jsx'
import { formatPassportTons } from '../../orders/components/qualityPassportTons.js'
import { qualityPassportKeys, useGetQualityPassportState } from '../../orders/utils/qualityPassports.queries.js'
import { catalogToday, formatPassportDate, nextPassportDate } from '../utils/catalogPassportDates.js'

import CatalogIssuePassportDialog from './CatalogIssuePassportDialog.jsx'
import CatalogPassportActions from './CatalogPassportActions.jsx'

const toQuantity = (value) => {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

function CatalogPassportSummary({ productName, data, isPending, isError, isRefreshing, hasIssuePermission, onIssue }) {
    const [viewOpen, setViewOpen] = useState(false)

    if (isPending) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 48 }}>
                <CircularProgress size={14} />
                <Typography variant="caption" color="text.secondary">
                    Загрузка паспорта…
                </Typography>
            </Box>
        )
    }

    if (isError && !data) {
        return (
            <Typography variant="caption" color="error.light">
                Не удалось загрузить паспорт качества.
            </Typography>
        )
    }

    const passport = data?.passport

    // Catalog issuance requires a previous passport; a first passport is created through the existing workflow.
    if (!passport) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 48 }}>
                <Typography variant="caption" color="text.secondary">
                    Паспорт качества не выпущен
                </Typography>
                <RenewAction
                    disabled
                    size="small"
                    title="Для выпуска из каталога необходим предыдущий паспорт"
                    aria-label="Для выпуска из каталога необходим предыдущий паспорт"
                />
            </Box>
        )
    }

    const issued = toQuantity(passport.quantity)
    const used = toQuantity(data.used_quantity)
    const remaining = toQuantity(data.remaining_quantity ?? issued - used)
    const isLatest = data.is_latest && data.latest_passport_id === passport.id
    const minDate = nextPassportDate(passport.issue_date)
    const dateAvailable = minDate && minDate <= catalogToday()
    const canRenew = hasIssuePermission && isLatest && dateAvailable && !isRefreshing && !isError
    let renewTitle = 'Создать паспорт'

    if (!hasIssuePermission) {
        renewTitle = 'Нет прав для выпуска паспорта качества'
    } else if (!dateAvailable) {
        renewTitle = 'Новый паспорт можно выпустить не раньше следующего календарного дня'
    } else if (isRefreshing) {
        renewTitle = 'Обновление действующего паспорта'
    } else if (!isLatest || isError) {
        renewTitle = 'Обновите каталог, чтобы получить действующий паспорт'
    }

    return (
        <Box sx={{ minWidth: 0, mt: 0.5 }}>
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
                    от {formatPassportDate(passport.issue_date)}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: -1 }}>
                <QualityPassportUsageBar issued={issued} used={used} />
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <CatalogPassportActions
                        passportId={passport.id}
                        passportSummary={passport}
                        productName={productName}
                    />
                    <RenewAction
                        disabled={!canRenew}
                        title={renewTitle}
                        aria-label={renewTitle}
                        onClick={() => onIssue(passport)}
                    />
                </Box>
            </Box>

            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Паспорт качества № {passport.number}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 1.5, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Дата паспорта
                        </Typography>
                        <Typography variant="body2">{formatPassportDate(passport.issue_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Номер партии
                        </Typography>
                        <Typography variant="body2">{formatBatchNumber(passport.batch_number) || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Дата изготовления
                        </Typography>
                        <Typography variant="body2">{formatPassportDate(passport.production_date)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Количество
                        </Typography>
                        <Typography variant="body2">{formatPassportTons(issued)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Использовано
                        </Typography>
                        <Typography variant="body2">{formatPassportTons(used)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Остаток
                        </Typography>
                        <Typography variant="body2">{formatPassportTons(remaining)}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={() => setViewOpen(false)}>
                        Закрыть
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default function CatalogPassportStatus({ productId, productName, product }) {
    const [issueFromPassport, setIssueFromPassport] = useState(null)
    const [snackbar, setSnackbar] = useState(null)
    const { hasPermission } = useAuth()
    const hasIssuePermission = hasPermission(PERMISSIONS.catalog.addQualityPassport)
    const queryClient = useQueryClient()
    const stateParams = { productId, source: 'catalog' }
    const result = useGetQualityPassportState(stateParams)

    const refreshPassports = () => queryClient.invalidateQueries({ queryKey: qualityPassportKeys.all })

    const handleSuccess = async (created) => {
        const queryKey = qualityPassportKeys.state(stateParams)
        await queryClient.cancelQueries({ queryKey, exact: true })
        queryClient.setQueryData(queryKey, (previous) => ({
            ...previous,
            passport: {
                id: created.id,
                number: created.number,
                issue_date: created.issue_date,
                batch_number: created.batch_number,
                production_date: created.production_date,
                quantity: created.quantity,
            },
            latest_passport_id: created.id,
            is_latest: true,
            used_quantity: '0.000',
            remaining_quantity: created.quantity,
        }))
        setIssueFromPassport(null)
        setSnackbar({ message: `Паспорт качества № ${created.number} выпущен.`, severity: 'success' })
        void refreshPassports()
    }

    const handleConflict = (code) => {
        setIssueFromPassport(null)
        setSnackbar({
            message:
                code === 'passport_number_conflict'
                    ? 'Предложенный номер паспорта уже занят. После обновления данных откройте создание заново.'
                    : 'Действующий паспорт изменился. После обновления данных откройте создание заново.',
            severity: 'warning',
        })
        void refreshPassports()
    }

    return (
        <>
            <CatalogPassportSummary
                productName={productName}
                data={result.data}
                isPending={result.isPending}
                isError={result.isError}
                isRefreshing={result.fetchStatus !== 'idle'}
                hasIssuePermission={hasIssuePermission}
                onIssue={setIssueFromPassport}
            />
            {issueFromPassport && (
                <CatalogIssuePassportDialog
                    productId={productId}
                    productName={product?.title || productName}
                    product={result.data?.product}
                    currentPassport={issueFromPassport}
                    suggestedNextPassportNumber={result.data?.suggested_next_passport_number}
                    onClose={() => setIssueFromPassport(null)}
                    onSuccess={handleSuccess}
                    onConflict={handleConflict}
                />
            )}
            <AppSnackbar
                open={Boolean(snackbar)}
                message={snackbar?.message}
                severity={snackbar?.severity}
                onClose={() => setSnackbar(null)}
            />
        </>
    )
}
