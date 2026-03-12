import { useParams } from 'react-router-dom'

import ObjectDetailWithContactList from '../../../pages/shared/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../../utils/emailValue.jsx'

export default function WarehouseDetailPage() {
    const { id } = useParams()
    const warehouseId = Number(id)

    return (
        <ObjectDetailWithContactList
            id={id}
            label="Склад"
            editTo={(id) => `/warehouses/${id}/edit`}
            entityUrl={(id) => `/api/stock/${id}/`}
            contactsUrl={(id) => `/api/stock/${id}/contacts/`}
            ownerType="warehouse"
            ownerId={warehouseId}
            fields={(w) => [
                { label: 'Наименование', value: w?.name },
                { label: 'Организация', value: w?.organization },
                { label: 'Адрес', value: w?.address },
                { label: 'Телефон', value: w?.phoneNumber },
                { label: 'Email', value: emailValue(w?.email) },
                { label: 'Примечание', value: w?.descriptions },
            ]}
        />
    )
}
