import { clickableDataGridSx } from '../../styles/dataGrid.styles.js'
import { filteriSummarySx } from '../../styles/filterSummary.styles.js'

export const orderFilteringPageSx = {
    ...filteriSummarySx,

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
}
