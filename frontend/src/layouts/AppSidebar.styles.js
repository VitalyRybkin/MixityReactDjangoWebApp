export const SIDEBAR_WIDTH = 300
export const TOPBAR_HEIGHT = 64
export const COLLAPSED_WIDTH = 48
export const SIDEBAR_DESKTOP_BREAKPOINT = 1100

const desktopMedia = `@media (min-width: ${SIDEBAR_DESKTOP_BREAKPOINT}px)`

export const sidebarPageSx = {
    page: {
        minHeight: `calc(100dvh - ${TOPBAR_HEIGHT}px)`,
        minWidth: 0,

        [desktopMedia]: {
            minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        },
    },

    content: {
        minWidth: 0,
        ml: 0,
        pt: 7,
        transition: 'margin-left 0.3s ease',

        [desktopMedia]: {
            pt: 4,
            ml: `${COLLAPSED_WIDTH}px`,
        },
    },

    contentWithSidebar: {
        ml: 0,

        [desktopMedia]: {
            ml: `${SIDEBAR_WIDTH}px`,
        },
    },
}

export const getSidebarSx = (open) => ({
    position: 'fixed',
    top: `${TOPBAR_HEIGHT}px`,
    left: 0,
    zIndex: 1100,

    width: open ? 'min(300px, 88vw)' : 0,

    height: `calc(100dvh - ${TOPBAR_HEIGHT}px)`,
    maxHeight: `calc(100dvh - ${TOPBAR_HEIGHT}px)`,

    p: open ? 2 : 0,
    boxSizing: 'border-box',

    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',

    bgcolor: open ? 'background.paper' : 'transparent',
    borderRight: 'none',
    boxShadow: open ? 4 : 0,

    overflow: open ? 'hidden' : 'visible',
    transition: 'width 0.3s ease',

    [desktopMedia]: {
        width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,

        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        maxHeight: 'none',

        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        boxShadow: 0,
    },
})

export const appSidebarSx = {
    closeButton: {
        mb: 2,
        flexShrink: 0,
    },

    scrollContent: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',

        pb: {
            xs: 'calc(24px + env(safe-area-inset-bottom))',
            sm: 2,
        },

        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        scrollbarWidth: 'thin',
    },

    collapsedButtonContainer: {
        display: 'flex',
        justifyContent: 'center',
        position: 'fixed',
        top: `${TOPBAR_HEIGHT + 12}px`,
        left: 8,
        pt: 0,
        zIndex: 1200,

        [desktopMedia]: {
            position: 'static',
            top: 'auto',
            left: 'auto',
            pt: 2,
            zIndex: 'auto',
        },
    },

    openButton: {
        minWidth: 0,
        width: 24,
        height: 40,
        p: 0,
        borderRadius: 2,

        bgcolor: 'background.paper',
        borderColor: 'primary.main',
        color: 'primary.main',
        boxShadow: 3,

        '&:hover': {
            bgcolor: 'background.paper',
            boxShadow: 4,
        },
    },
}
