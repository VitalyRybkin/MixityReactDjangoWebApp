import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Tooltip } from '@mui/material'

export const SIDEBAR_WIDTH = 300
export const TOPBAR_HEIGHT = 64
export const COLLAPSED_WIDTH = 48

export const sidebarPageSx = {
    page: {
        minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
    },
    content: {
        transition: 'margin-left 0.3s ease',
        ml: `${COLLAPSED_WIDTH}px`,
        pt: 4,
    },
    contentWithSidebar: {
        ml: `${SIDEBAR_WIDTH}px`,
    },
}

export default function AppSidebar({ open, setOpen, children }) {
    const sx = {
        position: 'fixed',
        top: `${TOPBAR_HEIGHT}px`,
        left: 0,
        zIndex: 1100,
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
    }

    return (
        <Box sx={sx}>
            {open ? (
                <>
                    <Tooltip title="Закрыть" placement="bottom" arrow>
                        <Button
                            variant="outlined"
                            onClick={() => setOpen(false)}
                            fullWidth
                            sx={{
                                mb: 2,
                                flexShrink: 0,
                            }}
                        >
                            <ChevronLeftIcon />
                        </Button>
                    </Tooltip>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                        }}
                    >
                        {children}
                    </Box>
                </>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Tooltip title="Открыть" placement="right" arrow>
                        <Button
                            variant="outlined"
                            onClick={() => setOpen(true)}
                            sx={{
                                minWidth: 0,
                                width: 24,
                                height: 40,
                                p: 0,
                                borderRadius: 1,
                            }}
                        >
                            <ChevronRightIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Box>
    )
}
