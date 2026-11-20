// Responsive layout and grid styles for the orders dashboard.
import { sidebarPageSx } from '../layouts/AppSidebar.styles.js'

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

// Adds the sidebar offset to the dashboard content when the filter panel is open.
export const getHomeContentSx = (sidebarOpen) => [
    sidebarPageSx.content,
    sidebarOpen && sidebarPageSx.contentWithSidebar,
]
