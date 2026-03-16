import { useNavigate, useParams } from 'react-router-dom'

import { Edit as EditIcon } from '@mui/icons-material'
import { Stack } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import EditAction from '../../../components/ui/buttons/EditAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'
import ObjectDetailWithContactList from '../../../pages/shared/ObjectDetailWithContactList.jsx'
import { emailValue } from '../../../utils/emailValue.jsx'

export default function WarehouseDetailPage() {
    const { id } = useParams()
    const warehouseId = Number(id)
    const navigate = useNavigate()

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
                {
                    label: 'Схема проезда',
                    value: w?.directions ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <ViewAction onClick={() => window.open(w.directions, '_blank', 'noopener,noreferrer')} />
                            <EditAction
                                onClick={() => navigate(`/warehouses/${w.id}/map`, { state: { warehouse: w.name } })}
                                icon={<EditIcon fontSize="small" />}
                            />
                        </Stack>
                    ) : (
                        <AddAction onClick={() => navigate(`/warehouses/${w.id}/map`)} />
                    ),
                },
            ]}
        />
    )
}
