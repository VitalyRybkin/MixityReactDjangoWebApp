import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../shared/ObjectDetailWithContactList.jsx'
import {emailValue} from "../../utils/emailValue.jsx";

export default function CarrierDetailPage() {
    const { id } = useParams()
    const carrierId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={id}
            label="Перевозчик"
            editTo={(id) => `/carrier/${id}/edit`}
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
