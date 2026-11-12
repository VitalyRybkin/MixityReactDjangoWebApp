export const formatTime = (value) => {
    if (!value) return '—'
    return value.slice(0, 5)
}

// YYYY-MM-DD is a calendar date, not a UTC timestamp.
// Date-time values retain their existing local-time formatting.
const parseDisplayDate = (value) => {
    if (!value) return null

    if (typeof value === 'string') {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
        if (match) {
            const year = Number(match[1])
            const month = Number(match[2])
            const day = Number(match[3])
            const date = new Date(0)
            date.setFullYear(year, month - 1, day)
            date.setHours(12, 0, 0, 0)

            if (
                date.getFullYear() !== year ||
                date.getMonth() !== month - 1 ||
                date.getDate() !== day
            ) {
                return null
            }
            return date
        }
    }

    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export const formatDateTime = (value) => {
    const date = parseDisplayDate(value)
    if (!date) return '—'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayOfWeek = date.toLocaleString('ru-RU', { weekday: 'short' })

    return `${day}.${month} [ ${dayOfWeek} ]`
}

export const formatDateYear = (value) => {
    const date = parseDisplayDate(value)
    if (!date) return '—'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())

    return `${day}.${month}.${year.slice(2)}`
}
