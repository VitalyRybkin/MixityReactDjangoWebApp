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

const todayLocal = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const newEmptyForm = (currentPassport, deliveryDate) => {
    const today = todayLocal()
    const upperBound = deliveryDate && isValidISODate(deliveryDate) ? deliveryDate : today
    const proposedDate = upperBound < today ? upperBound : today
    const issueDate = currentPassport?.issue_date > proposedDate ? currentPassport.issue_date : proposedDate

    return {
        number: '',
        batch_number: '',
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

const suggestNextNumber = (value) => {
    const previous = String(value || '').trim()
    const match = previous.match(/^(.*?)(\d+)$/s)
    if (!match) return null

    const digits = match[2]
    const nextDigits = String(BigInt(digits) + 1n).padStart(digits.length, '0')
    return `${match[1]}${nextDigits}`
}

const isValidISODate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const parsed = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const parseTonsToGrams = (value) => {
    const match = String(value ?? '')
        .trim()
        .replace(',', '.')
        .match(/^(\d{1,9})(?:\.(\d{1,3}))?$/)
    if (!match) return null

    const kilograms = BigInt(match[1]) * 1000n + BigInt((match[2] || '').padEnd(3, '0') || '0')
    return kilograms * 1000n
}

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

const getQuantityRule = (product) => {
    if (!product) return null
    if (!product.is_piece_based) return { stepGrams: 10000n, hint: 'Кратно 0,010 т' }

    const weightKg = product.product_unit?.value
    const stepGrams = parseKgToGrams(weightKg)
    if (stepGrams === null || stepGrams <= 0n) return null

    return {
        stepGrams,
        hint: `Кратно ${formatQuantity(Number(stepGrams) / 1_000_000)} т`,
    }
}

const getOrderQuantityGrams = (product, orderQuantity, rule) => {
    if (orderQuantity === '' || orderQuantity == null) return null

    if (product?.is_piece_based) {
        const count = String(orderQuantity).trim()
        return /^\d+$/.test(count) && rule ? BigInt(count) * rule.stepGrams : null
    }

    return parseTonsToGrams(orderQuantity)
}

export default function NewQualityPassportDialog({
    open,
    currentPassport,
    initialValue,
    product,
    orderQuantity,
    deliveryDate = null,
    isDraft = false,
    onClose,
    onConfirm,
    onRemove,
}) {
    const [form, setForm] = useState(() => ({
        ...newEmptyForm(currentPassport, deliveryDate),
        ...(initialValue || {}),
    }))
    const [errors, setErrors] = useState({})

    const suggestedPassportNumber = suggestNextNumber(currentPassport?.number)
    const suggestedBatchNumber = suggestNextNumber(currentPassport?.batch_number)
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
        const number = String(form.number).trim()
        const batchNumber = String(form.batch_number).trim()
        const issueDate = String(form.issue_date).trim()
        const productionDate = String(form.production_date).trim()
        const quantity = String(form.quantity).trim().replace(',', '.')
        const expectedLatestId = Number(initialValue?.expected_latest_passport_id ?? currentPassport?.id)
        const nextErrors = {}

        if (!number) nextErrors.number = 'Укажите номер паспорта.'
        else if (number.length > 50) nextErrors.number = 'Максимум 50 символов.'
        else if (number === currentPassport?.number) nextErrors.number = 'Новый номер должен отличаться от предыдущего.'

        if (!batchNumber) nextErrors.batch_number = 'Укажите номер партии.'
        else if (batchNumber.length > 100) nextErrors.batch_number = 'Максимум 100 символов.'

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
            const orderGrams = getOrderQuantityGrams(product, orderQuantity, quantityRule)
            if (orderGrams !== null && quantityGrams < orderGrams) {
                nextErrors.quantity = `Количество паспорта должно быть не меньше ${formatQuantity(Number(orderGrams) / 1_000_000)} т (вес позиции заявки).`
            }
        }
        if (!Number.isInteger(expectedLatestId) || expectedLatestId < 1) {
            nextErrors.general = 'Не удалось определить действующий паспорт. Обновите данные заявки.'
        }

        setErrors(nextErrors)
        if (isDraft || Object.keys(nextErrors).length) return

        onConfirm({
            expected_latest_passport_id: expectedLatestId,
            number,
            issue_date: issueDate,
            batch_number: batchNumber,
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
                                Номер партии: {currentPassport.batch_number || '—'}
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
                            placeholder={
                                suggestedPassportNumber
                                    ? `Номер паспорта (${suggestedPassportNumber})`
                                    : 'Номер паспорта'
                            }
                            value={form.number}
                            onChange={handleChange('number')}
                            error={Boolean(errors.number)}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 50 } }}
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
                            helperText={issueDateHelper}
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
                        placeholder={suggestedBatchNumber ? `Номер партии (${suggestedBatchNumber})` : 'Номер партии'}
                        value={form.batch_number}
                        onChange={handleChange('batch_number')}
                        error={Boolean(errors.batch_number)}
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
                                isValidISODate(form.issue_date)
                                    ? `Не позднее ${formatPassportDate(form.issue_date)}`
                                    : 'Укажите дату нового паспорта'
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
                            helperText={quantityRule?.hint || 'Не удалось определить шаг количества.'}
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
