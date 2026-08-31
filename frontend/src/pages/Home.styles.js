import { sidebarPageSx } from '../layouts/AppSidebar.jsx'
import {clickableDataGridSx} from "../styles/dataGrid.styles.js";

export const homeSx = {
    container: {
        mt: 1,
        px: {
            xs: 2,
            sm: 3,
        },
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
    },

    header: {
        pl: {
            xs: 0,
            sm: 1,
        },
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
    },

    headerActions: {
        display: 'flex',
        gap: {
            xs: 1,
            sm: 2,
        },
        flexShrink: 0,
        ml: 'auto',
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

    dataGrid: clickableDataGridSx,

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
