import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../../components/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../utils/emailValue.jsx'

import { repairCompaniesApiPaths } from './utils/repairApiPaths.js'

export default function RepairCompanyDetailPage() {
    const { id } = useParams()
    const clientId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={id}
            label="Ремонтная компания"
            editTo={(id) => `/repair/companies/${id}/edit`}
            entityUrl={(id) => repairCompaniesApiPaths.detail(id)}
            contactsUrl={(id) => repairCompaniesApiPaths.contacts(id)}
            ownerType="repair_company"
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
