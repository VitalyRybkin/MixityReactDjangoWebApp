export const formatDate = (date) => date.toLocaleDateString('en-CA')

export const getStartOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(0, 0, 0, 0)
    return end
}

export const getStartOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1)
    d.setHours(0, 0, 0, 0)
    return d
}

export const getEndOfMonth = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    d.setHours(0, 0, 0, 0)
    return d
}

export const getPresetRange = (preset) => {
    const now = new Date()

    if (preset === 'yesterday') {
        const d = new Date(now)
        d.setDate(d.getDate() - 1)
        const value = formatDate(d)
        return { dateFrom: value, dateTo: value }
    }

    if (preset === 'today') {
        const value = formatDate(now)
        return { dateFrom: value, dateTo: value }
    }

    if (preset === 'tomorrow') {
        const d = new Date(now)
        d.setDate(d.getDate() + 1)
        const value = formatDate(d)
        return { dateFrom: value, dateTo: value }
    }

    if (preset === 'currentWeek') {
        return {
            dateFrom: formatDate(getStartOfWeek(now)),
            dateTo: formatDate(getEndOfWeek(now)),
        }
    }

    if (preset === 'lastWeek') {
        const currentWeekStart = getStartOfWeek(now)
        const start = new Date(currentWeekStart)
        start.setDate(start.getDate() - 7)

        const end = new Date(currentWeekStart)
        end.setDate(end.getDate() - 1)

        return {
            dateFrom: formatDate(start),
            dateTo: formatDate(end),
        }
    }

    if (preset === 'nextWeek') {
        const currentWeekStart = getStartOfWeek(now)
        const start = new Date(currentWeekStart)
        start.setDate(start.getDate() + 7)

        const end = new Date(start)
        end.setDate(end.getDate() + 6)

        return {
            dateFrom: formatDate(start),
            dateTo: formatDate(end),
        }
    }

    if (preset === 'thisMonth') {
        return {
            dateFrom: formatDate(getStartOfMonth(now)),
            dateTo: formatDate(getEndOfMonth(now)),
        }
    }

    return { dateFrom: '', dateTo: '' }
}
