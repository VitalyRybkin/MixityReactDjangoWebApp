export const firstError = (e) => {
    const data = e?.response?.data

    if (!data) {
        return e?.message || 'Ошибка сохранения!'
    }

    if (Array.isArray(data)) {
        return data[0]
    }

    if (data?.errors?.length) {
        return data.errors[0]
    }

    if (data?.detail) {
        return data.detail
    }

    if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0]

        return firstKey
            ? `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`
            : 'Ошибка сохранения!'
    }

    if (typeof data === 'string') {
        return data
    }

    return e?.message || 'Ошибка сохранения!'
}
