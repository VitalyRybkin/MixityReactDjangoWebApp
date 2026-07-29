import { Outlet } from 'react-router-dom'

import { Container } from '@mui/material'

import TopBar from './TopBar'

const MainLayout = () => {
    return (
        <>
            <TopBar />
            <Container
                maxWidth="xl"
                sx={{
                    mt: 4,
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Outlet />
            </Container>
        </>
    )
}

export default MainLayout
