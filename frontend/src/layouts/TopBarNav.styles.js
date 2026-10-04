const NAV_BREAKPOINT = 1200

export const topBarNavSx = {
    nav: {
        ml: 3,
        display: 'none',

        [`@media (min-width: ${NAV_BREAKPOINT}px)`]: {
            display: 'flex',
        },
    },

    menuButton: {
        ml: 1,
        display: 'flex',

        [`@media (min-width: ${NAV_BREAKPOINT}px)`]: {
            display: 'none',
        },
    },

    navButton: {
        whiteSpace: 'nowrap',

        '&.active': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderBottom: '2px solid white',
            borderRadius: 0,
        },
    },

    activeNavButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderBottom: '2px solid white',
        borderRadius: 0,
    },

    menuItem: {
        fontSize: '0.95rem',
        fontWeight: 400,

        '&.active': {
            fontWeight: 500,
            backgroundColor: 'action.selected',
        },
    },
}