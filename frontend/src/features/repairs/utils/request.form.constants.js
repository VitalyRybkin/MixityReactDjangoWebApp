const localISODate = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Recompute defaults when a new form is mounted, not when the app's JS loads.
export const createEmptyRequestForm = () => ({
    request_date: localISODate(),
    closing_date: '',
    status: 'open',
    location: 'site',
    customerId: '',
    construction_object: '',
    description: '',
    closing_description: '',
})

export const statusOptions = {
    open: 'Открыта',
    closed: 'Закрыта',
}

export const locationOptions = {
    site: 'На объекте',
    workshop: 'В мастерской',
}
