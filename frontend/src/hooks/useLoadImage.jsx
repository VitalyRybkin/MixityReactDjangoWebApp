import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import EditIcon from '@mui/icons-material/Edit'
import { Stack } from '@mui/material'

import AddAction from '../components/ui/buttons/AddAction.jsx'
import EditAction from '../components/ui/buttons/EditAction.jsx'
import ViewAction from '../components/ui/buttons/ViewAction.jsx'

export default function useLoadImage() {
    const navigate = useNavigate()

    const renderActions = useCallback(
        (formField, navigateTo, url, options = {}) => {
            if (formField) {
                return (
                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                        <ViewAction onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} />
                        <EditAction
                            onClick={() => navigate(navigateTo, options)}
                            icon={<EditIcon fontSize="small" />}
                        />
                    </Stack>
                )
            }

            return <AddAction onClick={() => navigate(navigateTo)} />
        },
        [navigate],
    )

    return { renderActions }
}
