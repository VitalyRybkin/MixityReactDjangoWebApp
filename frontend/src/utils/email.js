export const EMAIL_HINT = 'Формат: name@example.com'
export const EMAIL_ERROR_MESSAGE = 'Введите корректный email'

export const normalizeEmailInput = (value) => {
    return (value ?? '').replace(/\s+/g, '').trimStart()
}

export const validateEmailValue = (value) => {
    const email = (value ?? '').trim()

    if (!email) return ''

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!regex.test(email)) {
        return EMAIL_ERROR_MESSAGE
    }

    return ''
}
