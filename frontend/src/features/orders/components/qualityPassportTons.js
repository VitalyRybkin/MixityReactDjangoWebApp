export const formatPassportTons = (value) => {
    const parsed = Number(value)
    if (value == null || !Number.isFinite(parsed)) return '—'

    return `${parsed.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} т`
}
