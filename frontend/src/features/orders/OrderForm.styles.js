import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'

export const orderFormSx = {
    container: {
        mt: 1,
        width: '100%',
        minWidth: 0,
        px: {
            xs: 2,
            sm: 3,
        },
    },

    form: {
        minWidth: 0,
    },

    header: {
        minWidth: 0,
    },

    mainFields: {
        display: 'flex',
        flexDirection: {
            xs: 'column',
            md: 'row',
        },
        alignItems: 'stretch',
        gap: 2,
        minWidth: 0,

        '& > *': {
            minWidth: 0,
            width: {
                xs: '100%',
                md: 'auto',
            },
            flex: {
                md: 1,
            },
        },
    },

    note: {
        mt: 2,
    },

    divider: {
        mb: 3,
    },

    bottomDivider: {
        mb: 1,
        mt: 2,
    },

    loading: {
        py: 6,
        display: 'flex',
        justifyContent: 'center',
    },

    products: {
        minWidth: 0,
        width: '100%',
    },

    weight: {
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },

    weightLabel: {
        m: 1,
    },
}

export const getOrderFormContentSx = (sidebarOpen) => [
    sidebarPageSx.content,
    sidebarOpen && sidebarPageSx.contentWithSidebar,
]
