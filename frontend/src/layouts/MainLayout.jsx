import { Outlet } from 'react-router-dom'

import { Container } from '@mui/material'

import TopBar from './TopBar'

const MainLayout = () => {
    return (
        <>
            <TopBar />
            <Container sx={{ mt: 4 }}>
                <Outlet />
            </Container>
        </>
    )
}

export default MainLayout
