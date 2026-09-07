import { sidebarPageSx } from '../layouts/AppSidebar.jsx'

export const homeSx = {
    container: {
        mt: 3,
        minWidth: 0,

        px: {
            xs: 2,
            sm: 3,
            md: 4,
        },
    },

    breadcrumbs: {
        pl: 2,
    },

    filtersSummary: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',

        columnGap: {
            xs: 2,
            sm: 3,
        },

        rowGap: {
            xs: 1,
            sm: 1.5,
        },

        p: 1,
        minWidth: 0,
    },

    filterItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
    },

    filterLabel: {
        color: 'text.secondary',
        whiteSpace: 'nowrap',
    },

    filterValue: {
        color: '#fc9e34',
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    divider: {
        mb: 1,
    },

    desktopGrid: {
        display: {
            xs: 'none',
            sm: 'block',
        },

        minWidth: 0,
    },

    dataGrid: {
        bgcolor: 'background.default',

        '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'background.default',
        },

        '& .MuiDataGrid-columnHeader': {
            bgcolor: 'background.default',
        },

        '& .MuiDataGrid-row': {
            cursor: 'pointer',
        },
    },

    exportAction: {
        display: {
            xs: 'none',
            sm: 'block',
        },
    },
}

export const getHomeContentSx = (sidebarOpen) => [
    sidebarPageSx.content,
    sidebarOpen && sidebarPageSx.contentWithSidebar,
]
