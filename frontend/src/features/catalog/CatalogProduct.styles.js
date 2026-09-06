import { commonLayoutSx } from '../../styles/layout.styles.js'

export const catalogProductSx = {
    page: commonLayoutSx.page,

    loading: {
        display: 'flex',
        justifyContent: 'center',
        p: 4,
    },

    title: {
        p: {
            xs: 2,
            sm: 3,
        },
    },

    divider: commonLayoutSx.divider,

    layout: {
        display: 'grid',

        gridTemplateColumns: {
            xs: '1fr',
            md: '360px minmax(0, 800px)',
        },

        columnGap: {
            md: 8,
            lg: 10,
        },

        rowGap: {
            xs: 4,
        },

        alignItems: 'start',
    },

    sidebar: {
        minWidth: 0,
    },

    sidebarSection: {
        mb: 5,
    },

    sidebarTitle: {
        mb: 2,
        fontWeight: 600,

        fontSize: {
            xs: '1.05rem',
            sm: '1.15rem',
        },
    },

    search: {
        mb: 2,

        '& .MuiInputBase-root': {
            minHeight: 46,
            fontSize: '1rem',
        },
    },

    entityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
    },

    entityButton: {
        width: '100%',
        minHeight: 44,

        justifyContent: 'flex-start',
        textAlign: 'left',
        textTransform: 'none',

        color: 'text.primary',

        fontSize: {
            xs: '0.95rem',
            sm: '1rem',
        },

        fontWeight: 400,

        borderRadius: 1.5,

        px: 2,
        py: 1,

        '&:hover': {
            bgcolor: 'action.hover',
        },
    },

    entityButtonSelected: {
        bgcolor: 'action.selected',
        fontWeight: 600,

        '&:hover': {
            bgcolor: 'action.selected',
        },
    },

    noResults: {
        px: 1,
        py: 1.5,
        fontSize: '0.95rem',
    },

    history: {
        width: '100%',
        minWidth: 0,
    },

    historyHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',

        gap: 2,

        minHeight: 64,

        pb: 2,
        mb: 2.5,

        borderBottom: 1,
        borderColor: 'divider',
    },

    historyTitle: {
        minWidth: 0,
        fontWeight: 600,

        fontSize: {
            xs: '1.35rem',
            sm: '1.6rem',
        },
    },

    priceRow: {
        display: 'grid',

        gridTemplateColumns: {
            xs: '110px minmax(0, 1fr)',
            sm: '150px minmax(0, 1fr)',
        },

        alignItems: 'center',

        width: '100%',
        minHeight: 54,

        px: {
            xs: 0.75,
            sm: 1.25,
        },

        border: 0,
        borderBottom: 1,
        borderColor: 'divider',

        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',

        '&:hover': {
            bgcolor: 'action.hover',
        },
    },

    date: {
        color: 'text.secondary',

        fontSize: {
            xs: '0.9rem',
            sm: '1rem',
        },
    },

    price: {
        textAlign: 'right',
        whiteSpace: 'nowrap',
        fontWeight: 500,

        fontSize: {
            xs: '0.95rem',
            sm: '1.05rem',
        },
    },

    pagination: {
        display: 'flex',
        justifyContent: 'center',
        pt: 4,
    },

    empty: {
        py: 6,
        color: 'text.secondary',
        textAlign: 'center',

        fontSize: {
            xs: '0.95rem',
            sm: '1rem',
        },
    },
}
