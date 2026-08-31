import { useNavigate } from 'react-router-dom'

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

import ThemeToggle from '../components/ThemeToggle'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants.js'
import { useAuth } from '../pages/auth/context/AuthContext.jsx'

import { topBarSx as sx } from './TopBar.styles.js'
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
        <AppBar position="sticky" elevation={1} sx={sx.appBar}>
            <Toolbar sx={sx.toolbar}>
                <TopBarNav />

                <Box sx={sx.spacer} />

                <Typography variant="body2" sx={sx.usernameLabel}>
                    Имя пользователя:
                </Typography>

                <Typography variant="body2" sx={sx.username}>
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </Typography>

                <Box sx={sx.themeToggle}>
                    <ThemeToggle />
                </Box>

                <Button color="inherit" onClick={handleLogout} sx={sx.logoutButton}>
                    Выйти
                </Button>
            </Toolbar>
        </AppBar>
    )
}

export default TopBar
