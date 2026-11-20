export const MAX_PASSPORT_NUMBER = 2_147_483_647
const MAX_BATCH_THOUSANDTHS = 999_999_999n

export function parsePassportNumber(value) {
    const text = String(value ?? '').trim()
    if (!/^\d+$/.test(text)) return null

    const number = Number(text)
    return number >= 1 && number <= MAX_PASSPORT_NUMBER ? number : null
}

function parseBatchThousandths(value) {
    const text = String(value ?? '')
        .trim()
        .replace(',', '.')
    const match = /^(\d+)(?:\.(\d{1,3}))?$/.exec(text.replace(/^\./, '0.'))
    if (!match) return null

    const thousandths = BigInt(match[1]) * 1000n + BigInt((match[2] ?? '').padEnd(3, '0'))
    return thousandths <= MAX_BATCH_THOUSANDTHS ? thousandths : null
}

function formatBatchThousandths(thousandths) {
    return `${thousandths / 1000n}.${String(thousandths % 1000n).padStart(3, '0')}`
}

export function formatBatchNumber(value) {
    const thousandths = parseBatchThousandths(value)
    return thousandths === null ? '' : formatBatchThousandths(thousandths)
}

export function suggestPassportNumbers(previous, suggestedNextPassportNumber) {
    const number = parsePassportNumber(suggestedNextPassportNumber)
    const batch = parseBatchThousandths(previous?.batch_number)
    return {
        number: number === null ? '' : String(number),
        batch_number: batch === null || batch === MAX_BATCH_THOUSANDTHS ? '' : formatBatchThousandths(batch + 1n),
    }
}

export function validatePassportNumbers(form, previous) {
    const errors = {}
    const number = parsePassportNumber(form.number)

    if (!String(form.number).trim()) errors.number = 'Укажите номер паспорта.'
    else if (number === null) errors.number = 'Укажите целое число от 1 до 2147483647.'
    else if (number === parsePassportNumber(previous?.number)) errors.number = 'Номер должен отличаться от предыдущего.'

    if (!String(form.batch_number).trim()) errors.batch_number = 'Укажите номер партии.'
    else if (!formatBatchNumber(form.batch_number))
        errors.batch_number = 'Укажите неотрицательное число (до 6 цифр до запятой и до 3 после).'

    return errors
}
