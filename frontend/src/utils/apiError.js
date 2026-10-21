const isHtmlResponse = (value) => {
    if (typeof value !== 'string') {
        return false
    }

    const text = value.trim().toLowerCase()

    return text.startsWith('<!doctype html') || text.startsWith('<html')
}

const firstValue = (value) => {
    if (Array.isArray(value)) {
        return firstValue(value[0])
    }

    if (value && typeof value === 'object') {
        const first = Object.values(value)[0]

        return firstValue(first)
    }

    if (typeof value === 'string') {
        return value
    }

    return null
}

export const firstError = (error) => {
    const status = error?.response?.status
    const data = error?.response?.data

    if (status === 503) {
        return 'Сервис временно недоступен. Попробуйте позже.'
    }

    if (isHtmlResponse(data)) {
        if (status === 404) {
            return 'Запрашиваемый объект не найден.'
        }

        if (status === 403) {
            return 'Недостаточно прав для выполнения операции.'
        }

        if (status >= 500) {
            return 'Ошибка сервера. Попробуйте позже.'
        }

        return 'Не удалось выполнить запрос.'
    }

    if (typeof data === 'string' && data.trim()) {
        return data
    }

    if (data?.detail) {
        return firstValue(data.detail) ?? 'Не удалось выполнить запрос.'
    }

    if (data?.non_field_errors) {
        return firstValue(data.non_field_errors)
    }

    if (data && typeof data === 'object') {
        const message = firstValue(data)

        if (message) {
            return message
        }
    }

    if (!error?.response) {
        return 'Не удалось связаться с сервером.'
    }

    return 'Не удалось выполнить запрос.'
}

export const API_ERROR_EVENT = 'app:api-error'

let lastNotificationAt = 0

export const notifyApiError = (error) => {
    if (typeof window === 'undefined') {
        return
    }

    const now = Date.now()

    if (now - lastNotificationAt < 3000) {
        return
    }

    lastNotificationAt = now

    window.dispatchEvent(
        new CustomEvent(API_ERROR_EVENT, {
            detail: {
                message: firstError(error),
            },
        }),
    )
}
