import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import TopBar from './TopBar'

const FullWidthLayout = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <TopBar />
            <Outlet />
        </Box>
    )
}

export default FullWidthLayout