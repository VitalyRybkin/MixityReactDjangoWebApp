export const topBarSx = {
    appBar: {
        width: '100%',
        maxWidth: 'none',
    },

    toolbar: {
        width: '100%',
        boxSizing: 'border-box',
    },

    spacer: {
        flexGrow: 1,
    },

    usernameLabel: {
        mr: 2,
        flexShrink: 0,
        display: 'none',

        '@media (min-width: 1450px)': {
            display: 'block',
        },
    },

    username: {
        mr: {
            xs: 1,
            md: 4,
        },
        flexShrink: 0,
    },

    themeToggle: {
        flexShrink: 0,
    },

    logoutButton: {
        ml: {
            xs: 1,
            md: 2,
        },
        textTransform: 'none',
        fontWeight: 500,
        flexShrink: 0,
    },
}