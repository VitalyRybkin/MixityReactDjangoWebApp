import React, { useState } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {Box, Button, Container, Divider, Tooltip, Typography} from '@mui/material'
import AppBreadcrumbs from "../components/AppBreadcrumbs.jsx";
import AddAction from "../components/ui/buttons/AddAction.jsx";
import {useNavigate} from "react-router-dom";

const SIDEBAR_WIDTH = 280
const TOPBAR_HEIGHT = 64
const COLLAPSED_WIDTH = 48

const sx = {
    page: {
        minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    },
    sidebar: (open) => ({
        position: 'fixed',
        top: `${TOPBAR_HEIGHT}px`,
        left: 0,
        width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        p: open ? 2 : 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    }),
    collapsedButtonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        pt: 2,
    },
    collapsedButton: {
        minWidth: 0,
        width: 24,
        height: 40,
        p: 0,
        borderRadius: 1,
    },
    closeButton: {
        minWidth: 0,
    },
    content: {
        transition: 'margin-left 0.3s ease',
        ml: `${COLLAPSED_WIDTH}px`,
        pt: 4,
    },
    contentWithSidebar: {
        ml: `${SIDEBAR_WIDTH}px`,
    },
    card: {
        p: { xs: 4, md: 6 },
        borderRadius: 4,
        maxWidth: 700,
        width: '100%',
    },
    title: {
        fontWeight: 700,
        mb: 2,
    },
    wrapper: {
        display: 'flex',
        justifyContent: 'center',
    },
}

const Home = () => {
    const [open, setOpen] = useState(true)
    const navigate = useNavigate()


    return (
        <Box sx={sx.page}>
            <Box sx={sx.sidebar(open)}>
                {open ? (
                    <>
                        <Tooltip title="Закрыть" placement="bottom" arrow>
                            <Button
                                variant="outlined"
                                onClick={() => setOpen(false)}
                                fullWidth
                                sx={sx.closeButton}
                            >
                                <ChevronLeftIcon />
                            </Button>
                        </Tooltip>

                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Filters
                        </Typography>
                    </>
                ) : (
                    <Box sx={sx.collapsedButtonWrapper}>
                        <Tooltip title="Открыть" placement="right" arrow>
                            <Button
                                variant="outlined"
                                onClick={() => setOpen(true)}
                                sx={sx.collapsedButton}
                            >
                                <ChevronRightIcon fontSize="small" />
                            </Button>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <Box sx={{ ...sx.content, ...(open ? sx.contentWithSidebar : {}) }}>
                <Container maxWidth="xl" sx={{ mt: 1 }}>
                    <AppBreadcrumbs />
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4" gutterBottom fontWeight={600}>
                            Заявки
                        </Typography>
                        <AddAction onClick={() => navigate("/", { state: { from: location.pathname } })} />
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                </Container>
            </Box>
        </Box>
    )
}

export default Home