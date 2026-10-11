const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

export const emptyRequestForm = {
    id: '',
    request_date: today.toISOString().split('T')[0],
    closing_date: null,
    client: null,
    customer: null,
    construction_object: null,
    status: 'open',
    location: 'site',
    description: '',
    closing_description: '',
}
