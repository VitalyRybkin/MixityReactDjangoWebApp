const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

export const emptyRequestForm = {
    request_date: today.toISOString().split('T')[0],
    closing_date: '',
    status: 'open',
    location: 'site',

    customerId: '',
    construction_object: '',

    description: '',
    closing_description: '',
}

export const statusOptions = {
    open: 'Открыта',
    closed: 'Закрыта',
}

export const locationOptions = {
    site: 'На объекте',
    workshop: 'В мастерской',
}
