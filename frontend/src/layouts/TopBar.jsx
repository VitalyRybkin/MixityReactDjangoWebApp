import { useNavigate } from 'react-router-dom'

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

import ThemeToggle from '../components/ThemeToggle'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants.js'
import { useAuth } from '../pages/auth/context/AuthContext.jsx'

import TopBarNav from './TopBarNav.jsx'

const TopBar = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        navigate('/login', { replace: true })
    }

    return (
        <AppBar
            position="sticky"
            elevation={1}
            sx={{
                width: '100%',
                maxWidth: 'none',
            }}
        >
            <Toolbar
                sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <TopBarNav />

                <Box sx={{ flexGrow: 1 }} />

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mr: 2,
                        flexShrink: 0,
                        display: 'none',

                        '@media (min-width: 1450px)': {
                            display: 'block',
                        },
                    }}
                >
                    Имя пользователя:
                </Typography>

                <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                        mr: { xs: 1, md: 4 },
                        flexShrink: 0,
                    }}
                >
                    {user?.first_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                </Typography>

                <Box sx={{ flexShrink: 0 }}>
                    <ThemeToggle />
                </Box>

                <Button
                    color="inherit"
                    onClick={handleLogout}
                    sx={{
                        ml: { xs: 1, md: 2 },
                        textTransform: 'none',
                        fontWeight: 500,
                        flexShrink: 0,
                    }}
                >
                    Выйти
                </Button>
            </Toolbar>
        </AppBar>
    )
}

export default TopBar