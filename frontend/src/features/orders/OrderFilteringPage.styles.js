import { clickableDataGridSx } from '../../styles/dataGrid.styles.js'
import { filteringPageSx } from '../../styles/filteringPage.styles.js'

export const orderFilteringPageSx = {
    ...filteringPageSx,

    checkboxGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: {
            xs: 0.5,
            sm: 1,
        },
    },

    checkboxLabel: {
        typography: {
            fontSize: '14px',
            color: 'text.secondary',
        },
    },

    dataGrid: clickableDataGridSx,

    exportAction: {
        display: {
            xs: 'none',
            sm: 'block',
        },
    },
}
