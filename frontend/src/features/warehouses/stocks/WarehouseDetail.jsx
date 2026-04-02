import { useParams } from 'react-router-dom'

import useLoadImage from '../../../hooks/useLoadImage.jsx'
import ObjectDetailWithContactList from '../../../pages/shared/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../../utils/emailValue.jsx'
import { warehouseApiPaths } from '../warehouseApiPaths.js'

export default function WarehouseDetailPage() {
    const { id } = useParams()
    const warehouseId = Number(id)
    const { renderActions } = useLoadImage()
    return (
        <ObjectDetailWithContactList
            id={id}
            label="Склад"
            editTo={(id) => `/warehouses/${id}/edit`}
            entityUrl={(id) => warehouseApiPaths.detail(id)}
            contactsUrl={(id) => warehouseApiPaths.contacts(id)}
            ownerType="warehouse"
            ownerId={warehouseId}
            fields={(w) => [
                { label: 'Наименование', value: w?.name },
                { label: 'Организация', value: w?.organization },
                { label: 'Адрес', value: w?.address },
                { label: 'Телефон', value: w?.phoneNumber },
                { label: 'Email', value: emailValue(w?.email) },
                { label: 'Примечание', value: w?.description },
                {
                    label: 'Схема проезда',
                    value: renderActions(w?.directions, `/warehouses/${w?.id}/map`, w?.directions, {
                        state: { warehouse: w?.name },
                    }),
                },
            ]}
        />
    )
}
