import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../../pages/shared/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../utils/emailValue.jsx'

import { customerApiPaths } from './customerApiPaths.js'

export default function CustomerDetailPage() {
    const { id } = useParams()
    const customerId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={customerId}
            label="Заказчик"
            editTo={(id) => `/customers/${id}/edit`}
            entityUrl={(id) => customerApiPaths.detail(id)}
            contactsUrl={(id) => customerApiPaths.contacts(id)}
            ownerType="customer"
            ownerId={customerId}
            fields={(c) => [
                { label: 'Наименование', value: c?.name },
                { label: 'Полное наименование', value: c?.organization },
                { label: 'Адрес', value: c?.address },
                { label: 'Телефон', value: c?.phone },
                { label: 'Email', value: emailValue(c?.email) },
            ]}
        />
    )
}
