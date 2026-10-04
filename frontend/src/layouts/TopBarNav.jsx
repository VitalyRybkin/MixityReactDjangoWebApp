import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
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
import { topBarNavSx as sx } from './TopBarNav.styles.js'

const REFERENCE_GROUPS = [
    GROUPS.LOGISTIC_MANAGER,
    GROUPS.ACCOUNTANT,
]

const REFERENCE_ITEMS = [
    { label: 'Перевозчики', to: '/carriers'},
    { label: 'Склады', to: '/warehouses'},
    { label: 'Поставщики', to: '/clients'},
    { label: 'Заказчики', to: '/customers'},
    { label: 'Ремонт', to: '/repair/companies'},
]

const NAV_ITEMS = [
    { label: 'Документация', to: '/documentation'},
    { label: 'Поиск', to: '/filtering'},
]

const MenuItems = ({ items, onClick }) =>
    items.map(({ label, to }) => (
        <MenuItem
            key={to}
            component={NavLink}
            to={to}
            onClick={onClick}
            sx={sx.menuItem}
        >
            {label}
        </MenuItem>
    ))

const TopBarNav = () => {
    const location = useLocation()

    const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null)
    const [referencesAnchorEl, setReferencesAnchorEl] = useState(null)

    const mobileMenuOpen = Boolean(mobileMenuAnchorEl)
    const referencesMenuOpen = Boolean(referencesAnchorEl)

    const referencesActive = REFERENCE_ITEMS.some(({ to }) =>
        location.pathname.startsWith(to),
    )

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
                <Button
                    component={NavLink}
                    to="/"
                    color="inherit"
                    sx={sx.navButton}
                >
                    Главная
                </Button>

                <Can group={REFERENCE_GROUPS}>
                    <Button
                        color="inherit"
                        onClick={handleOpenReferencesMenu}
                        endIcon={<ArrowDropDownIcon />}
                        sx={[
                            sx.navButton,
                            referencesActive && sx.activeNavButton,
                        ]}
                        aria-controls={
                            referencesMenuOpen
                                ? 'references-menu'
                                : undefined
                        }
                        aria-haspopup="true"
                        aria-expanded={
                            referencesMenuOpen ? 'true' : undefined
                        }
                    >
                        Справочники
                    </Button>
                </Can>

                {NAV_ITEMS.map(({ label, to }) => (
                    <Button
                        key={to}
                        component={NavLink}
                        to={to}
                        color="inherit"
                        sx={sx.navButton}
                    >
                        {label}
                    </Button>
                ))}

                <Can group={[GROUPS.ADMINS]}>
                    <Button
                        component={NavLink}
                        to="/catalog"
                        color="inherit"
                        sx={sx.navButton}
                    >
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
                <Can group={REFERENCE_GROUPS}>
                    <MenuItems
                        items={REFERENCE_ITEMS}
                        onClick={handleCloseAllMenus}
                    />
                </Can>
            </Menu>

            <Tooltip title="Меню">
                <IconButton
                    color="inherit"
                    onClick={handleOpenMobileMenu}
                    sx={sx.menuButton}
                    aria-label="Открыть меню"
                    aria-controls={
                        mobileMenuOpen
                            ? 'top-bar-menu'
                            : undefined
                    }
                    aria-haspopup="true"
                    aria-expanded={
                        mobileMenuOpen ? 'true' : undefined
                    }
                >
                    <MenuIcon />
                </IconButton>
            </Tooltip>

            <Menu
                id="top-bar-menu"
                anchorEl={mobileMenuAnchorEl}
                open={mobileMenuOpen}
                onClose={handleCloseMobileMenu}
            >
                {mobileReferencesOpen ? (
                    <>
                        <MenuItem onClick={() => setMobileReferencesOpen(false)}>
                            ← Назад
                        </MenuItem>

                        <Can group={REFERENCE_GROUPS}>
                            <MenuItems
                                items={REFERENCE_ITEMS}
                                onClick={handleCloseMobileMenu}
                            />
                        </Can>
                    </>
                ) : (
                    <>
                        <MenuItem
                            component={NavLink}
                            to="/"
                            onClick={handleCloseMobileMenu}
                            sx={sx.menuItem}
                        >
                            Главная
                        </MenuItem>

                        <Can group={REFERENCE_GROUPS}>
                            <MenuItem
                                onClick={() => setMobileReferencesOpen(true)}
                            >
                                Справочники
                            </MenuItem>
                        </Can>

                        <MenuItems
                            items={NAV_ITEMS}
                            onClick={handleCloseMobileMenu}
                        />

                        <Can group={[GROUPS.ADMINS]}>
                            <MenuItem
                                component={NavLink}
                                to="/catalog"
                                onClick={handleCloseMobileMenu}
                                sx={sx.menuItem}
                            >
                                Каталог
                            </MenuItem>
                        </Can>
                    </>
                )}
            </Menu>
        </>
    )
}

export default TopBarNav