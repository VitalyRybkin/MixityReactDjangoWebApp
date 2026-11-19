import { useId, useRef, useState } from 'react'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import api from '../../../api.js'
import { firstError } from '../../../utils/apiError.js'
import { catalogToday, formatPassportDate, isPassportDate, nextPassportDate } from '../utils/catalogPassportDates.js'

const suggestNextNumber = (value) => {
    const match = String(value || '')
        .trim()
        .match(/^(.*?)(\d+)$/s)
    if (!match) return null
    return `${match[1]}${String(BigInt(match[2]) + 1n).padStart(match[2].length, '0')}`
}

const normalizeQuantity = (value) =>
    value
        .trim()
        .replace(',', '.')
        .replace(/^0+(?=\d)/, '')
        .replace(/^\./, '0.')

// With three decimal places in tonnes and whole-kilogram packaging, integer kilograms are exact.
const parseQuantityKg = (quantity) => {
    const match = /^(\d{1,9})(?:\.(\d{1,3}))?$/.exec(quantity)
    if (!match) return null
    return BigInt(match[1]) * 1000n + BigInt((match[2] ?? '').padEnd(3, '0'))
}

const quantityStepKg = (product) => {
    const config = product?.product_unit
    const unit = config?.unit?.title
    if (unit === 'ton') return 10n
    if (unit !== 'piece') return null
    const weight = Number(config.value)
    return Number.isSafeInteger(weight) && weight > 0 ? BigInt(weight) : null
}

const formatStep = (kg) =>
    (Number(kg) / 1000).toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

const asMessage = (value) => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return asMessage(value[0])
    if (value && typeof value === 'object') return asMessage(value.detail || value.message)
    return ''
}

export default function CatalogIssuePassportDialog({
    productId,
    productName,
    product,
    currentPassport,
    onClose,
    onSuccess,
    onConflict,
}) {
    const titleId = useId()
    const savingRef = useRef(false)
    const [form, setForm] = useState(() => {
        const today = catalogToday()
        return { number: '', issue_date: today, batch_number: '', production_date: today, quantity: '' }
    })
    const [errors, setErrors] = useState({})
    const [requestError, setRequestError] = useState('')
    const [saving, setSaving] = useState(false)

    const minDate = nextPassportDate(currentPassport?.issue_date)
    const maxDate = catalogToday()
    const impossibleRange = !minDate || minDate > maxDate
    const stepKg = quantityStepKg(product)

    const handleChange = (key) => (event) => {
        const value = event.target.value
        setForm((prev) => ({
            ...prev,
            ...(key === 'issue_date' && value && prev.production_date > value ? { production_date: value } : {}),
            [key]: value,
        }))
        setErrors((prev) => ({
            ...prev,
            [key]: undefined,
            ...(key === 'issue_date' ? { production_date: undefined } : {}),
        }))
        setRequestError('')
    }

    const validate = () => {
        const nextErrors = {}
        const number = form.number.trim()
        const batch = form.batch_number.trim()
        const kg = parseQuantityKg(normalizeQuantity(form.quantity))

        if (!number) nextErrors.number = 'Укажите номер паспорта.'
        else if (number.length > 50) nextErrors.number = 'Максимум 50 символов.'
        else if (number === currentPassport?.number) nextErrors.number = 'Номер должен отличаться от предыдущего.'

        if (!batch) nextErrors.batch_number = 'Укажите номер партии.'
        else if (batch.length > 100) nextErrors.batch_number = 'Максимум 100 символов.'

        if (!isPassportDate(form.issue_date)) nextErrors.issue_date = 'Укажите корректную дату паспорта.'
        else if (form.issue_date < minDate)
            nextErrors.issue_date = `Дата должна быть не раньше ${formatPassportDate(minDate)}.`
        else if (form.issue_date > maxDate) nextErrors.issue_date = 'Дата паспорта не может быть позже сегодняшней.'

        if (!isPassportDate(form.production_date)) nextErrors.production_date = 'Укажите дату изготовления.'
        else if (isPassportDate(form.issue_date) && form.production_date > form.issue_date) {
            nextErrors.production_date = 'Дата изготовления не может быть позже даты паспорта.'
        }

        if (kg === null || kg <= 0n) {
            nextErrors.quantity = 'Укажите положительное количество в тоннах (до 3 знаков после запятой).'
        } else if (kg % stepKg !== 0n) {
            nextErrors.quantity = `Количество должно быть кратно ${formatStep(stepKg)} т.`
        }

        return nextErrors
    }

    const handleSave = async () => {
        if (savingRef.current || impossibleRange || !stepKg) return
        const nextErrors = validate()
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return

        const payload = {
            product_id: productId,
            expected_latest_passport_id: currentPassport.id,
            number: form.number.trim(),
            issue_date: form.issue_date,
            batch_number: form.batch_number.trim(),
            production_date: form.production_date,
            quantity: normalizeQuantity(form.quantity),
        }

        savingRef.current = true
        setSaving(true)
        setRequestError('')
        try {
            const response = await api.post('/api/catalog/quality-passports/', payload)
            await onSuccess(response.data)
        } catch (error) {
            const status = error?.response?.status

            if (status === 409) {
                onConflict()
            } else if (status === 400) {
                const responseData = error.response.data
                const fields = responseData?.errors ?? responseData
                const fieldErrors = {}

                for (const field of Object.keys(form)) {
                    const message = asMessage(fields?.[field])
                    if (message) fieldErrors[field] = message
                }
                setErrors(fieldErrors)
                const message = asMessage(fields?.non_field_errors) || asMessage(fields?.detail)
                setRequestError(message || (Object.keys(fieldErrors).length ? '' : firstError(error)))
            } else if (status === 403) {
                setRequestError('Нет прав для выпуска паспорта качества.')
            } else if (status === 404) {
                setRequestError('Продукция или действующий паспорт не найдены. Обновите каталог.')
            } else {
                setRequestError(
                    status ? 'Не удалось выпустить паспорт качества. Повторите попытку.' : firstError(error),
                )
            }
        } finally {
            savingRef.current = false
            setSaving(false)
        }
    }

    const close = () => {
        if (!savingRef.current) onClose()
    }

    const suggestedNumber = suggestNextNumber(currentPassport.number)
    const suggestedBatch = suggestNextNumber(currentPassport.batch_number)

    return (
        <Dialog open onClose={close} fullWidth maxWidth="sm" aria-labelledby={titleId}>
            <DialogTitle id={titleId}>Создание паспорта качества</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {productName}
                    </Typography>
                    <Box sx={{ px: 1.5, py: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Предыдущий паспорт
                        </Typography>
                        <Typography variant="body2">
                            № {currentPassport.number} от {formatPassportDate(currentPassport.issue_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Номер партии: {currentPassport.batch_number || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Дата изготовления: {formatPassportDate(currentPassport.production_date)}
                        </Typography>
                    </Box>
                    {impossibleRange && (
                        <Alert severity="warning">
                            Новый паспорт можно выпустить не раньше {formatPassportDate(minDate)}. На текущую дату
                            выпуск недоступен.
                        </Alert>
                    )}
                    {!stepKg && <Alert severity="warning">Для продукции не настроена единица измерения.</Alert>}
                    {requestError && <Alert severity="error">{requestError}</Alert>}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                            gap: 1,
                            alignItems: 'start',
                        }}
                    >
                        <TextField
                            size="small"
                            fullWidth
                            required
                            label="Паспорт №"
                            placeholder={suggestedNumber ? `Номер паспорта (${suggestedNumber})` : 'Номер паспорта'}
                            value={form.number}
                            onChange={handleChange('number')}
                            error={Boolean(errors.number)}
                            helperText={errors.number}
                            disabled={saving}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 50 } }}
                        />
                        <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary', pb: 0.5 }}>
                            от
                        </Typography>
                        <TextField
                            size="small"
                            fullWidth
                            required
                            label="*"
                            type="date"
                            value={form.issue_date}
                            onChange={handleChange('issue_date')}
                            error={Boolean(errors.issue_date)}
                            helperText={
                                errors.issue_date ||
                                (minDate ? `С ${formatPassportDate(minDate)} по ${formatPassportDate(maxDate)}` : '')
                            }
                            disabled={saving}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: minDate || undefined, max: maxDate, 'aria-label': 'Дата паспорта' },
                            }}
                        />
                    </Box>
                    <TextField
                        size="small"
                        fullWidth
                        required
                        label="Номер партии"
                        placeholder={suggestedBatch ? `Номер партии (${suggestedBatch})` : 'Номер партии'}
                        value={form.batch_number}
                        onChange={handleChange('batch_number')}
                        error={Boolean(errors.batch_number)}
                        helperText={errors.batch_number}
                        disabled={saving}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 100 } }}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            required
                            label="Дата изготовления"
                            type="date"
                            value={form.production_date}
                            onChange={handleChange('production_date')}
                            error={Boolean(errors.production_date)}
                            helperText={
                                errors.production_date ||
                                (isPassportDate(form.issue_date)
                                    ? `Не позднее ${formatPassportDate(form.issue_date)}`
                                    : '')
                            }
                            disabled={saving}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { max: form.issue_date || undefined },
                            }}
                        />
                        <TextField
                            size="small"
                            fullWidth
                            required
                            label="Количество, т"
                            value={form.quantity}
                            onChange={handleChange('quantity')}
                            error={Boolean(errors.quantity)}
                            helperText={
                                errors.quantity ||
                                (stepKg ? `Кратно ${formatStep(stepKg)} т` : 'Нет данных о единице продукции')
                            }
                            disabled={saving}
                            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                        />
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button type="button" onClick={close} disabled={saving}>
                    Отмена
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || impossibleRange || !stepKg}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {saving ? 'Сохранение…' : 'Выпустить паспорт'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
