import { useParams } from 'react-router-dom'

import ObjectInfoWithContactList, { emailValue } from '../shared/ObjectInfoWithContactList.jsx'

export default function CarrierInfoPage() {
    const { id } = useParams()
    const carrierId = Number(id)

    return (
        <ObjectInfoWithContactList
            id={id}
            label="Перевозчик"
            editTo={(id) => `/carriers/${id}/edit`}
            entityUrl={(id) => `/api/logistic/carriers/${id}/`}
            contactsUrl={(id) => `/api/logistic/carriers/${id}/contacts/`}
            ownerType="carrier"
            ownerId={carrierId}
            fields={(c) => [
                { label: 'Полное наименование', value: c?.fullName },
                { label: 'Адрес', value: c?.address },
                { label: 'Телефон', value: c?.phone },
                { label: 'Email', value: emailValue(c?.email) },
                { label: 'Примечание', value: c?.description },
            ]}
        />
    )
}
