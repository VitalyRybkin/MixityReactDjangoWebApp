import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import MenuIcon from '@mui/icons-material/Menu'
import {
    Button,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
} from '@mui/material'

import Can from '../pages/auth/components/Can.jsx'
import { GROUPS } from '../pages/auth/permissions.js'

const TopBarNav = () => {
    const [anchorEl, setAnchorEl] = useState(null)

    const menuOpen = Boolean(anchorEl)

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleCloseMenu = () => {
        setAnchorEl(null)
    }

    const buttonSx = {
        whiteSpace: 'nowrap',

        '&.active': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderBottom: '2px solid white',
            borderRadius: 0,
        },
    }

    const menuItemSx = {
        '&.active': {
            fontWeight: 600,
            backgroundColor: 'action.selected',
        },
    }

    return (
        <>
            {/* Regular menu */}
            <Stack
                direction="row"
                spacing={2}
                sx={{
                    ml: 3,
                    display: 'none',

                    '@media (min-width: 1100px)': {
                        display: 'flex',
                    },
                }}
            >
                <Button component={NavLink} to="/" color="inherit" sx={buttonSx}>
                    Главная
                </Button>

                <Can group={[GROUPS.LOGISTIC_MANAGER, GROUPS.ACCOUNTANT]}>
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
                </Can>

                <Button component={NavLink} to="/documentation" color="inherit" sx={buttonSx}>
                    Документация
                </Button>

                <Button component={NavLink} to="/filtering" color="inherit" sx={buttonSx}>
                    Поиск
                </Button>
            </Stack>

            {/* Burger */}
            <Tooltip title="Меню">
                <IconButton
                    color="inherit"
                    onClick={handleOpenMenu}
                    sx={{
                        ml: 1,
                        display: 'flex',

                        '@media (min-width: 1100px)': {
                            display: 'none',
                        },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>

            {/* Dropdown menu*/}
            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleCloseMenu}
            >
                <MenuItem
                    component={NavLink}
                    to="/"
                    onClick={handleCloseMenu}
                    sx={menuItemSx}
                >
                    Главная
                </MenuItem>

                <Can group={[GROUPS.LOGISTIC_MANAGER, GROUPS.ACCOUNTANT]}>
                    <MenuItem
                        component={NavLink}
                        to="/carriers"
                        onClick={handleCloseMenu}
                        sx={menuItemSx}
                    >
                        Перевозчики
                    </MenuItem>

                    <MenuItem
                        component={NavLink}
                        to="/warehouses"
                        onClick={handleCloseMenu}
                        sx={menuItemSx}
                    >
                        Склады
                    </MenuItem>

                    <MenuItem
                        component={NavLink}
                        to="/clients"
                        onClick={handleCloseMenu}
                        sx={menuItemSx}
                    >
                        Клиенты
                    </MenuItem>

                    <MenuItem
                        component={NavLink}
                        to="/customers"
                        onClick={handleCloseMenu}
                        sx={menuItemSx}
                    >
                        Заказчики
                    </MenuItem>
                </Can>

                <MenuItem
                    component={NavLink}
                    to="/documentation"
                    onClick={handleCloseMenu}
                    sx={menuItemSx}
                >
                    Документация
                </MenuItem>

                <MenuItem
                    component={NavLink}
                    to="/filtering"
                    onClick={handleCloseMenu}
                    sx={menuItemSx}
                >
                    Поиск
                </MenuItem>
            </Menu>
        </>
    )
}

export default TopBarNav