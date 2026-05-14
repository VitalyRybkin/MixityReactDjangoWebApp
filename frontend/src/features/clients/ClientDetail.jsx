import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../../components/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../utils/emailValue.jsx'

import { clientApiPaths } from './utils/clientApiPaths.js'

export default function ClientDetailPage() {
    const { id } = useParams()
    const clientId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={id}
            label="Клиент"
            editTo={(id) => `/clients/${id}/edit`}
            entityUrl={(id) => clientApiPaths.detail(id)}
            contactsUrl={(id) => clientApiPaths.contacts(id)}
            ownerType="client"
            ownerId={clientId}
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
