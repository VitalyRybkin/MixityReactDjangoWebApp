import { useState } from 'react'

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import { formatBatchNumber, parsePassportNumber, suggestPassportNumbers, validatePassportNumbers } from '../../../utils/qualityPassportNumbers.js'

const todayLocal = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const newEmptyForm = (currentPassport, deliveryDate, openingSuggestion) => {
    const today = todayLocal()
    const upperBound = deliveryDate && isValidISODate(deliveryDate) ? deliveryDate : today
    const proposedDate = upperBound < today ? upperBound : today
    const issueDate = currentPassport?.issue_date > proposedDate ? currentPassport.issue_date : proposedDate

    return {
        ...suggestPassportNumbers(currentPassport, openingSuggestion),
        issue_date: issueDate,
        production_date: issueDate,
        quantity: '',
    }
}

const formatPassportDate = (value) => {
    if (!value) return '—'

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
    return match ? `${match[3]}.${match[2]}.${match[1]}` : String(value)
}

const isValidISODate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** @returns {bigint | null} */
const parseTonsToGrams = (value) => {
    const match = String(value ?? '')
        .trim()
        .replace(',', '.')
        .match(/^(\d{1,9})(?:\.(\d{1,3}))?$/)
    if (!match) return null

    const kilograms = BigInt(match[1]) * 1000n + BigInt((match[2] || '').padEnd(3, '0') || '0')
    return kilograms * 1000n
}

/** @returns {bigint | null} */
const parseKgToGrams = (value) => {
    const match = String(value ?? '')
        .trim()
        .replace(',', '.')
        .match(/^(\d+)(?:\.(\d{1,3}))?$/)
    if (!match) return null

    return BigInt(match[1]) * 1000n + BigInt((match[2] || '').padEnd(3, '0') || '0')
}

const formatQuantity = (tonnes) =>
    Number(tonnes).toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 6 })

/** @typedef {{ stepGrams: bigint, hint: string }} QuantityRule */

/** @returns {QuantityRule | null} */
const getQuantityRule = (product) => {
    const config = product?.product_unit
    const unit = config?.unit?.title
    if (unit === 'ton') return { stepGrams: 10000n, hint: 'Кратно 0,010 т' }
    if (unit !== 'piece') return null

    const stepGrams = parseKgToGrams(config.value)
    if (stepGrams === null || stepGrams <= 0n) return null

    return {
        stepGrams,
        hint: `Кратно ${formatQuantity(Number(stepGrams) / 1_000_000)} т`,
    }
}

/**
 * @param {{ is_piece_based?: boolean, product_unit?: { value?: string | number } } | null | undefined} product
 * @param {string | number | null | undefined} orderQuantity
 * @returns {bigint | null}
 */
const getOrderQuantityGrams = (product, orderQuantity) => {
    if (orderQuantity === '' || orderQuantity == null) return null

    if (product?.is_piece_based) {
        const count = String(orderQuantity).trim()
        const weightGrams = parseKgToGrams(product.product_unit?.value)
        return /^\d+$/.test(count) && weightGrams !== null && weightGrams > 0n ? BigInt(count) * weightGrams : null
    }

    return parseTonsToGrams(orderQuantity)
}

export default function NewQualityPassportDialog({
    open,
    currentPassport,
    suggestedNextPassportNumber,
    initialValue,
    product,
    orderQuantity,
    deliveryDate = null,
    isDraft = false,
    onClose,
    onConfirm,
    onRemove,
}) {
    const [openingSuggestion] = useState(suggestedNextPassportNumber)
    const [form, setForm] = useState(() => ({
        ...newEmptyForm(currentPassport, deliveryDate, openingSuggestion),
        ...(initialValue || {}),
    }))
    const [errors, setErrors] = useState({})

    const numberHint = initialValue && openingSuggestion && parsePassportNumber(form.number) !== openingSuggestion
        ? `Предложенный номер: ${openingSuggestion}`
        : undefined
    const quantityRule = getQuantityRule(product)
    const hasDeliveryDate = deliveryDate && isValidISODate(deliveryDate)
    const impossibleDateRange = hasDeliveryDate && currentPassport?.issue_date > deliveryDate
    const issueDateHelper =
        currentPassport?.issue_date && hasDeliveryDate
            ? `С ${formatPassportDate(currentPassport.issue_date)} по ${formatPassportDate(deliveryDate)}`
            : currentPassport?.issue_date
              ? `Не ранее ${formatPassportDate(currentPassport.issue_date)}`
              : hasDeliveryDate
                ? `Не позднее ${formatPassportDate(deliveryDate)}`
                : 'Дата выдачи паспорта'

    const handleChange = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }))
        setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    const handleConfirm = () => {
        const issueDate = String(form.issue_date).trim()
        const productionDate = String(form.production_date).trim()
        const quantity = String(form.quantity).trim().replace(',', '.')
        const expectedLatestId = Number(initialValue?.expected_latest_passport_id ?? currentPassport?.id)
        const nextErrors = validatePassportNumbers(form, currentPassport)

        if (!isValidISODate(issueDate)) {
            nextErrors.issue_date = 'Укажите корректную дату паспорта.'
        } else if (currentPassport?.issue_date && issueDate < currentPassport.issue_date) {
            nextErrors.issue_date = `Дата не может быть раньше ${formatPassportDate(currentPassport.issue_date)}.`
        } else if (deliveryDate && isValidISODate(deliveryDate) && issueDate > deliveryDate) {
            nextErrors.issue_date = `Дата не может быть позже доставки ${formatPassportDate(deliveryDate)}.`
        }

        if (!isValidISODate(productionDate)) {
            nextErrors.production_date = 'Укажите корректную дату изготовления.'
        } else if (isValidISODate(issueDate) && productionDate > issueDate) {
            nextErrors.production_date = 'Дата изготовления не может быть позже даты паспорта.'
        }

        const quantityGrams = parseTonsToGrams(quantity)
        if (quantityGrams === null || quantityGrams <= 0n) {
            nextErrors.quantity = 'Укажите положительное количество в тоннах (до 3 знаков после запятой).'
        } else if (!quantityRule) {
            nextErrors.quantity = 'Не удалось определить вес единицы продукции. Проверьте настройки товара.'
        } else if (quantityGrams % quantityRule.stepGrams !== 0n) {
            nextErrors.quantity = `Количество должно быть кратно ${formatQuantity(Number(quantityRule.stepGrams) / 1_000_000)} т.`
        } else {
            const orderGrams = getOrderQuantityGrams(product, orderQuantity)
            if (orderGrams !== null && quantityGrams < orderGrams) {
                nextErrors.quantity = `Количество паспорта должно быть не меньше ${formatQuantity(Number(orderGrams) / 1_000_000)} т (вес позиции заявки).`
            }
        }
        if (!Number.isInteger(expectedLatestId) || expectedLatestId < 1) {
            nextErrors.general = 'Не удалось определить действующий паспорт. Обновите данные заявки.'
        }

        setErrors(nextErrors)
        if (isDraft || Object.keys(nextErrors).length) return

        const number = parsePassportNumber(form.number)
        const originalSuggestion = number === parsePassportNumber(initialValue?.number)
            ? initialValue?.suggested_next_passport_number
            : openingSuggestion
        onConfirm({
            expected_latest_passport_id: expectedLatestId,
            number,
            ...(number === originalSuggestion ? { suggested_next_passport_number: number } : {}),
            issue_date: issueDate,
            batch_number: formatBatchNumber(form.batch_number),
            production_date: productionDate,
            quantity,
        })
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Создание паспорта качества</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {currentPassport && (
                        <Box sx={{ px: 1.5, py: 1.25, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Предыдущий паспорт
                            </Typography>
                            <Typography variant="body2">
                                № {currentPassport.number} от {formatPassportDate(currentPassport.issue_date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Номер партии: {formatBatchNumber(currentPassport.batch_number) || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Дата изготовления: {formatPassportDate(currentPassport.production_date)}
                            </Typography>
                        </Box>
                    )}
                    {isDraft && (
                        <Alert severity="warning">
                            Создание паспорта для черновика запрещено. Смените статус заявки или уберите введённый новый
                            паспорт.
                        </Alert>
                    )}
                    {errors.general && <Alert severity="error">{errors.general}</Alert>}
                    {impossibleDateRange && (
                        <Alert severity="error">
                            Дата предыдущего паспорта позже даты доставки заявки. Создать новый паспорт с такими датами
                            нельзя.
                        </Alert>
                    )}
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
                            value={form.number}
                            onChange={handleChange('number')}
                            error={Boolean(errors.number)}
                            helperText={errors.number || numberHint}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'numeric' } }}
                        />
                        <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary', pb: 0.5 }}>
                            от
                        </Typography>
                        <TextField
                            size="small"
                            fullWidth
                            label="*"
                            type="date"
                            value={form.issue_date}
                            onChange={handleChange('issue_date')}
                            error={Boolean(errors.issue_date)}
                            helperText={errors.issue_date || issueDateHelper}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: {
                                    min: currentPassport?.issue_date || undefined,
                                    max: hasDeliveryDate ? deliveryDate : undefined,
                                    'aria-label': 'Дата паспорта',
                                    required: true,
                                },
                            }}
                        />
                    </Box>
                    <TextField
                        size="small"
                        fullWidth
                        required
                        label="Номер партии"
                        value={form.batch_number}
                        onChange={handleChange('batch_number')}
                        error={Boolean(errors.batch_number)}
                        helperText={errors.batch_number}
                        slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'decimal' } }}
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
                                (isValidISODate(form.issue_date)
                                    ? `Не позднее ${formatPassportDate(form.issue_date)}`
                                    : 'Укажите дату нового паспорта')
                            }
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
                            type="text"
                            value={form.quantity}
                            onChange={handleChange('quantity')}
                            error={Boolean(errors.quantity)}
                            helperText={errors.quantity || quantityRule?.hint || 'Не удалось определить шаг количества.'}
                            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                        />
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {initialValue && (
                    <Button type="button" color="error" onClick={onRemove} sx={{ mr: 'auto', fontWeight: 400 }}>
                        Удалить
                    </Button>
                )}
                <Button type="button" onClick={onClose}>
                    Отмена
                </Button>
                <Button
                    type="button"
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={isDraft || impossibleDateRange}
                >
                    Применить
                </Button>
            </DialogActions>
        </Dialog>
    )
}
