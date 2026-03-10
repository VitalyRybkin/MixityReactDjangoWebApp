export const firstError = (e) => {
    const data = e?.response?.data

    if (data?.errors?.length) return data.errors[0]
    if (data?.detail) return data.detail

    if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        return firstKey
            ? `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`
            : 'Ошибка сохранения!'
    }

    return e?.message || 'Ошибка сохранения!'
}