export const formatTime = (value) => {
    if (!value) return '—'
    return value.slice(0, 5)
}
export const formatDateTime = (value) => {
    if (!value) return '—'

    const date = new Date(value)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')

    const dayOfWeek = date.toLocaleString('ru-RU', { weekday: 'short' })
    return `${day}.${month} [ ${dayOfWeek} ]`
}
