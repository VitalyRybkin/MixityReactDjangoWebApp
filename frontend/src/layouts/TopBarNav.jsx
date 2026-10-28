import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import MenuIcon from '@mui/icons-material/Menu'
import { Button, IconButton, Menu, MenuItem, Stack, Tooltip } from '@mui/material'

import Can from '../pages/auth/components/Can.jsx'
import { PERMISSIONS } from '../pages/auth/permissions.js'

import { topBarNavSx as sx } from './TopBarNav.styles.js'

const REFERENCE_ITEMS = [
    {
        label: 'Перевозчики',
        to: '/carriers',
        permission: PERMISSIONS.carriers.view,
    },
    {
        label: 'Склады',
        to: '/warehouses',
        permission: PERMISSIONS.warehouses.view,
    },
    {
        label: 'Поставщики',
        to: '/clients',
        permission: PERMISSIONS.clients.view,
    },
    {
        label: 'Покупатели',
        to: '/customers',
        permission: PERMISSIONS.customers.view,
    },
    {
        label: 'Ремонт',
        to: '/repair/companies',
        permission: PERMISSIONS.repairCompanies.view,
    },
]

const REFERENCE_PERMISSIONS = REFERENCE_ITEMS.map(({ permission }) => permission)

const NAV_ITEMS = [
    {
        label: 'Документация',
        to: '/documentation',
    },
    {
        label: 'Поиск',
        to: '/filtering',
        permission: PERMISSIONS.orders.view,
    },
    {
        label: 'Ремонт',
        to: '/repair/requests',
        permission: PERMISSIONS.repairRequests.view,
    },
]

const MenuItems = ({ items, onClick }) =>
    items.map(({ label, to, permission }) => (
        <Can key={to} permission={permission}>
            <MenuItem component={NavLink} to={to} onClick={onClick} sx={sx.menuItem}>
                {label}
            </MenuItem>
        </Can>
    ))

const TopBarNav = () => {
    const location = useLocation()

    const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null)
    const [referencesAnchorEl, setReferencesAnchorEl] = useState(null)

    const mobileMenuOpen = Boolean(mobileMenuAnchorEl)
    const referencesMenuOpen = Boolean(referencesAnchorEl)

    const referencesActive = REFERENCE_ITEMS.some(({ to }) => location.pathname.startsWith(to))

    const handleOpenMobileMenu = (event) => {
        setMobileMenuAnchorEl(event.currentTarget)
    }

    const handleCloseMobileMenu = () => {
        setMobileMenuAnchorEl(null)
        setMobileReferencesOpen(false)
    }

    const handleOpenReferencesMenu = (event) => {
        setReferencesAnchorEl(event.currentTarget)
    }

    const handleCloseReferencesMenu = () => {
        setReferencesAnchorEl(null)
    }

    const handleCloseAllMenus = () => {
        setReferencesAnchorEl(null)
        setMobileMenuAnchorEl(null)
    }

    const [mobileReferencesOpen, setMobileReferencesOpen] = useState(false)

    return (
        <>
            <Stack direction="row" spacing={2} sx={sx.nav}>
                <Button component={NavLink} to="/" color="inherit" sx={sx.navButton}>
                    Главная
                </Button>

                <Can any={REFERENCE_PERMISSIONS}>
                    <Button
                        color="inherit"
                        onClick={handleOpenReferencesMenu}
                        endIcon={<ArrowDropDownIcon />}
                        sx={[sx.navButton, referencesActive && sx.activeNavButton]}
                        aria-controls={referencesMenuOpen ? 'references-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={referencesMenuOpen ? 'true' : undefined}
                    >
                        Справочники
                    </Button>
                </Can>

                {NAV_ITEMS.map(({ label, to, permission }) => (
                    <Can key={to} permission={permission}>
                        <Button component={NavLink} to={to} color="inherit" sx={sx.navButton}>
                            {label}
                        </Button>
                    </Can>
                ))}

                <Can permission={PERMISSIONS.catalog.view}>
                    <Button component={NavLink} to="/catalog" color="inherit" sx={sx.navButton}>
                        Каталог
                    </Button>
                </Can>
            </Stack>

            <Menu
                id="references-menu"
                anchorEl={referencesAnchorEl}
                open={referencesMenuOpen}
                onClose={handleCloseReferencesMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: referencesAnchorEl?.offsetWidth,
                        },
                    },
                }}
            >
                <Can any={REFERENCE_PERMISSIONS}>
                    <MenuItems items={REFERENCE_ITEMS} onClick={handleCloseAllMenus} />
                </Can>
            </Menu>

            <Tooltip title="Меню">
                <IconButton
                    color="inherit"
                    onClick={handleOpenMobileMenu}
                    sx={sx.menuButton}
                    aria-label="Открыть меню"
                    aria-controls={mobileMenuOpen ? 'top-bar-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={mobileMenuOpen ? 'true' : undefined}
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>

            <Menu id="top-bar-menu" anchorEl={mobileMenuAnchorEl} open={mobileMenuOpen} onClose={handleCloseMobileMenu}>
                {mobileReferencesOpen ? (
                    <MenuItem onClick={() => setMobileReferencesOpen(false)}>← Назад</MenuItem>
                ) : (
                    <MenuItem component={NavLink} to="/" onClick={handleCloseMobileMenu} sx={sx.menuItem}>
                        Главная
                    </MenuItem>
                )}

                {mobileReferencesOpen ? (
                    <Can any={REFERENCE_PERMISSIONS}>
                        <MenuItems items={REFERENCE_ITEMS} onClick={handleCloseMobileMenu} />
                    </Can>
                ) : (
                    <Can any={REFERENCE_PERMISSIONS}>
                        <MenuItem onClick={() => setMobileReferencesOpen(true)}>Справочники</MenuItem>
                    </Can>
                )}

                {!mobileReferencesOpen && <MenuItems items={NAV_ITEMS} onClick={handleCloseMobileMenu} />}

                {!mobileReferencesOpen && (
                    <Can permission={PERMISSIONS.catalog.view}>
                        <MenuItem component={NavLink} to="/catalog" onClick={handleCloseMobileMenu} sx={sx.menuItem}>
                            Каталог
                        </MenuItem>
                    </Can>
                )}
            </Menu>
        </>
    )
}

export default TopBarNav
