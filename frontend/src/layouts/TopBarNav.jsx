import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import MenuIcon from '@mui/icons-material/Menu'
import { Button, IconButton, Menu, MenuItem, Stack, Tooltip } from '@mui/material'

import Can from '../pages/auth/components/Can.jsx'
import { GROUPS } from '../pages/auth/permissions.js'

const NAV_BREAKPOINT = 1100

const sx = {
    nav: {
        ml: 3,
        display: 'none',

        [`@media (min-width: ${NAV_BREAKPOINT}px)`]: {
            display: 'flex',
        },
    },

    menuButton: {
        ml: 1,
        display: 'flex',

        [`@media (min-width: ${NAV_BREAKPOINT}px)`]: {
            display: 'none',
        },
    },

    navButton: {
        whiteSpace: 'nowrap',

        '&.active': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderBottom: '2px solid white',
            borderRadius: 0,
        },
    },

    menuItem: {
        '&.active': {
            fontWeight: 600,
            backgroundColor: 'action.selected',
        },
    },
}

const TopBarNav = () => {
    const [anchorEl, setAnchorEl] = useState(null)

    const menuOpen = Boolean(anchorEl)

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleCloseMenu = () => {
        setAnchorEl(null)
    }

    return (
        <>
            <Stack direction="row" spacing={2} sx={sx.nav}>
                <Button component={NavLink} to="/" color="inherit" sx={sx.navButton}>
                    Главная
                </Button>

                <Can group={[GROUPS.LOGISTIC_MANAGER, GROUPS.ACCOUNTANT]}>
                    <Button component={NavLink} to="/carriers" color="inherit" sx={sx.navButton}>
                        Перевозчики
                    </Button>

                    <Button component={NavLink} to="/warehouses" color="inherit" sx={sx.navButton}>
                        Склады
                    </Button>

                    <Button component={NavLink} to="/clients" color="inherit" sx={sx.navButton}>
                        Клиенты
                    </Button>

                    <Button component={NavLink} to="/customers" color="inherit" sx={sx.navButton}>
                        Заказчики
                    </Button>
                </Can>

                <Button component={NavLink} to="/documentation" color="inherit" sx={sx.navButton}>
                    Документация
                </Button>

                <Button component={NavLink} to="/filtering" color="inherit" sx={sx.navButton}>
                    Поиск
                </Button>
            </Stack>

            <Tooltip title="Меню">
                <IconButton
                    color="inherit"
                    onClick={handleOpenMenu}
                    sx={sx.menuButton}
                    aria-label="Открыть меню"
                    aria-controls={menuOpen ? 'top-bar-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={menuOpen ? 'true' : undefined}
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>

            <Menu id="top-bar-menu" anchorEl={anchorEl} open={menuOpen} onClose={handleCloseMenu}>
                <MenuItem component={NavLink} to="/" onClick={handleCloseMenu} sx={sx.menuItem}>
                    Главная
                </MenuItem>

                <Can group={[GROUPS.LOGISTIC_MANAGER, GROUPS.ACCOUNTANT]}>
                    <MenuItem component={NavLink} to="/carriers" onClick={handleCloseMenu} sx={sx.menuItem}>
                        Перевозчики
                    </MenuItem>

                    <MenuItem component={NavLink} to="/warehouses" onClick={handleCloseMenu} sx={sx.menuItem}>
                        Склады
                    </MenuItem>

                    <MenuItem component={NavLink} to="/clients" onClick={handleCloseMenu} sx={sx.menuItem}>
                        Клиенты
                    </MenuItem>

                    <MenuItem component={NavLink} to="/customers" onClick={handleCloseMenu} sx={sx.menuItem}>
                        Заказчики
                    </MenuItem>
                </Can>

                <MenuItem component={NavLink} to="/documentation" onClick={handleCloseMenu} sx={sx.menuItem}>
                    Документация
                </MenuItem>

                <MenuItem component={NavLink} to="/filtering" onClick={handleCloseMenu} sx={sx.menuItem}>
                    Поиск
                </MenuItem>
            </Menu>
        </>
    )
}

export default TopBarNav
