export const firstError = (e) => {
    const data = e?.response?.data

    if (!data) {
        return e?.message || 'Ошибка сохранения!'
    }

    // Preferred flat messages from backend
    if (Array.isArray(data.messages) && data.messages.length > 0) {
        return data.messages[0].replace(/^detail:\s*/i, '')
    }

    // DRF detail error
    if (typeof data.detail === 'string') {
        return data.detail
    }

    // Validation errors
    if (data.errors && typeof data.errors === 'object') {
        const [firstKey] = Object.keys(data.errors)

        if (firstKey) {
            const value = data.errors[firstKey]
            const text = Array.isArray(value) ? value[0] : value

            return firstKey === 'detail' ? text : `${firstKey}: ${text}`
        }
    }

    // Fallback for plain DRF validation responses
    if (typeof data === 'object') {
        const [firstKey] = Object.keys(data)

        if (firstKey) {
            const value = data[firstKey]
            const text = Array.isArray(value) ? value[0] : value

            return firstKey === 'detail' ? text : `${firstKey}: ${text}`
        }
    }

    if (Array.isArray(data)) {
        return data[0]
    }

    if (typeof data === 'string') {
        return data
    }

    return e?.message || 'Ошибка сохранения!'
}
