import { NavLink } from 'react-router-dom'

import { Button, Stack } from '@mui/material'

const TopBarNav = () => {
    const buttonSx = {
        '&.active': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderBottom: '2px solid white',
            borderRadius: 0,
        },
    }

    return (
        <Stack direction="row" spacing={2} sx={{ ml: 3 }}>
            <Button component={NavLink} to="/" color="inherit" sx={buttonSx}>
                Главная
            </Button>

            <Button component={NavLink} to="/carriers" color="inherit" sx={buttonSx}>
                Перевозчики
            </Button>

            <Button component={NavLink} to="/warehouses" color="inherit" sx={buttonSx}>
                Склады
            </Button>

            <Button component={NavLink} to="/clients" color="inherit" sx={buttonSx}>
                Клиенты
            </Button>

            <Button component={NavLink} to="/customers" color="inherit" sx={buttonSx}>
                Заказчики
            </Button>

            <Button component={NavLink} to="/documentation" color="inherit" sx={buttonSx}>
                Документация
            </Button>
        </Stack>
    )
}

export default TopBarNav
