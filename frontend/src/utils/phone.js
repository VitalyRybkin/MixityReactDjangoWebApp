export const PHONE_ERROR_MESSAGE = 'Введите номер в формате +79991234567'

export const emptyPhone = () => ({ phoneNumber: '' })

export const safeStr = (value) => value ?? ''

export const normalizePhoneInput = (value) => {
    let cleaned = safeStr(value).replace(/[^\d+]/g, '')

    if (cleaned.includes('+')) {
        cleaned = '+' + cleaned.replace(/\+/g, '')
    }

    if (cleaned.startsWith('+')) {
        cleaned = '+' + cleaned.slice(1).replace(/\D/g, '').slice(0, 11)
    } else {
        cleaned = cleaned.replace(/\D/g, '').slice(0, 11)
    }

    return cleaned
}

export const normalizePhoneForSubmit = (value) => {
    const raw = safeStr(value).trim()
    const digits = raw.replace(/\D/g, '')

    if (!digits) return ''

    if (digits.length === 11 && digits.startsWith('8')) {
        return `+7${digits.slice(1)}`
    }

    if (digits.length === 11 && digits.startsWith('7')) {
        return `+${digits}`
    }

    if (raw.startsWith('+')) {
        return `+${digits}`
    }

    return raw
}

export const validatePhoneValue = (value) => {
    const normalized = normalizePhoneForSubmit(value)

    if (!normalized) return ''

    if (!/^\+7\d{10}$/.test(normalized)) {
        return PHONE_ERROR_MESSAGE
    }

    return ''
}

export const validatePhoneList = (phones = []) => {
    return phones.map((item) => validatePhoneValue(item?.phoneNumber))
}

export const buildPhonePayload = (phones = []) => {
    return phones
        .map((item) => ({
            phoneNumber: normalizePhoneForSubmit(item?.phoneNumber),
        }))
        .filter((item) => item.phoneNumber.length > 0)
}
