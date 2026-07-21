import { useNavigate } from 'react-router-dom'

import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'

import ThemeToggle from '../components/ThemeToggle'
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants.js'
import { useAuth } from '../pages/auth/context/AuthContext.jsx'

import TopBarNav from './TopBarNav.jsx'

const sx = {
    title: {
        fontWeight: 600,
    },
    logout: {
        ml: 2,
        textTransform: 'none',
        fontWeight: 500,
    },
}

const TopBar = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        navigate('/login', { replace: true })
    }

    return (
        <AppBar position="sticky" elevation={1}>
            <Toolbar>
                {/*<Typography variant="h6" sx={sx.title}>*/}
                {/*    Заявки на доставку*/}
                {/*</Typography>*/}
                <TopBarNav> </TopBarNav>

                <Box sx={{ flexGrow: 1 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    Имя пользователя:
                </Typography>

                <Typography variant="body2" color="text.primary" sx={{ mr: 4 }}>
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                </Typography>

                <ThemeToggle />

                <Button color="inherit" onClick={handleLogout} sx={sx.logout}>
                    Выйти
                </Button>
            </Toolbar>
        </AppBar>
    )
}

export default TopBar
