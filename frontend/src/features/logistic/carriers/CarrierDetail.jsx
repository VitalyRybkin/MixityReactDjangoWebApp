import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../../../pages/shared/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../../utils/emailValue.jsx'

import { carrierApiPaths } from './carrierApiPaths.js'

export default function CarrierDetailPage() {
    const { id } = useParams()
    const carrierId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={id}
            label="Грузоперевозчик"
            editTo={(id) => `/carriers/${id}/edit`}
            entityUrl={(id) => carrierApiPaths.detail(id)}
            contactsUrl={(id) => carrierApiPaths.contacts(id)}
            ownerType="carrier"
            ownerId={carrierId}
            fields={(c) => [
                { label: 'Наименование', value: c?.name },
                { label: 'Полное наименование', value: c?.fullName },
                { label: 'Адрес', value: c?.address },
                { label: 'Телефон', value: c?.phone },
                { label: 'Email', value: emailValue(c?.email) },
                { label: 'Примечание', value: c?.description },
            ]}
        />
    )
}
