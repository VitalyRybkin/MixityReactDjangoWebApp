// Catalog issuance uses Django's UTC calendar date.
export const catalogToday = () => new Date().toISOString().slice(0, 10)

export const isPassportDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const nextPassportDate = (value) => {
    if (!isPassportDate(value)) return null
    const date = new Date(`${value}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + 1)
    const next = date.toISOString().split('T')[0]
    return isPassportDate(next) ? next : null
}

export const formatPassportDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    return match ? `${match[3]}.${match[2]}.${match[1]}` : '—'
}
