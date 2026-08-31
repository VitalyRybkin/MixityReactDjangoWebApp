import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Tooltip } from '@mui/material'

import {
    COLLAPSED_WIDTH,
    SIDEBAR_DESKTOP_BREAKPOINT,
    SIDEBAR_WIDTH,
    TOPBAR_HEIGHT,
    getSidebarSx,
    sidebarPageSx,
    appSidebarSx as sx,
} from './AppSidebar.styles.js'

export { COLLAPSED_WIDTH, SIDEBAR_DESKTOP_BREAKPOINT, SIDEBAR_WIDTH, sidebarPageSx, TOPBAR_HEIGHT }

export default function AppSidebar({ open, setOpen, children }) {
    return (
        <Box sx={getSidebarSx(open)}>
            {open ? (
                <>
                    <Tooltip title="Закрыть" placement="bottom" arrow>
                        <Button
                            variant="outlined"
                            onClick={() => setOpen(false)}
                            fullWidth
                            sx={sx.closeButton}
                            aria-label="Закрыть фильтры"
                        >
                            <ChevronLeftIcon />
                        </Button>
                    </Tooltip>

                    <Box sx={sx.scrollContent}>{children}</Box>
                </>
            ) : (
                <Box sx={sx.collapsedButtonContainer}>
                    <Tooltip title="Открыть" placement="right" arrow>
                        <Button
                            variant="outlined"
                            onClick={() => setOpen(true)}
                            sx={sx.openButton}
                            aria-label="Открыть фильтры"
                        >
                            <ChevronRightIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Box>
    )
}
