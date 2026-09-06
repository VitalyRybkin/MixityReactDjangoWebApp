import { sidebarPageSx } from '../../layouts/AppSidebar.jsx'
import { commonLayoutSx } from '../../styles/layout.styles.js'

export const orderFormSx = {
    container: {
        ...commonLayoutSx.pageHorizontal,
        mt: 1,
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

    divider: commonLayoutSx.divider,

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
