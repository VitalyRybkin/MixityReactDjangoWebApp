export default function getErrorMessage(error) {
    if (error?.isNetworkError) {
        return 'Нет связи с сервером'
    }

    if (error?.response?.data?.detail) {
        return error.response.data.detail
    }

    if (error?.response?.data && typeof error.response.data === 'object') {
        const entries = Object.entries(error.response.data)

        if (entries.length) {
            return entries
                .map(([field, messages]) => {
                    const text = Array.isArray(messages) ? messages.join(', ') : String(messages)
                    return `${field}: ${text}`
                })
                .join(' ')
        }
    }

    if (typeof error?.message === 'string' && error.message === 'Network Error') {
        return 'Нет связи с сервером'
    }

    return error?.message || 'Не удалось выполнить запрос'
}
