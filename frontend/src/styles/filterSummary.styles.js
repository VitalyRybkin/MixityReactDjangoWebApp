import { commonLayoutSx } from './layout.styles.js'

export const filteriSummarySx = {
    page: commonLayoutSx.page,

    header: {
        ...commonLayoutSx.header,

        display: 'flex',
        flexDirection: {
            xs: 'column',
            sm: 'row',
        },
    },

    title: {
        m: 0,
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    headerActions: {
        display: 'flex',
        justifyContent: {
            xs: 'flex-start',
            sm: 'flex-end',
        },
        gap: 2,
    },

    filters: {
        display: 'grid',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: {
            xs: 2,
            md: 3,
        },
        pt: 2,
        alignItems: 'start',
        minWidth: 0,
    },

    filterColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
    },

    filterSummary: {
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

    filterSummaryItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        minHeight: 24,
    },

    filterSummaryLabel: {
        color: 'text.secondary',
        whiteSpace: 'nowrap',
    },

    filterSummaryValue: (theme) => ({
        color: theme.palette.mode === 'dark' ? '#fc9e34' : '#d25100',
        minWidth: 0,
        overflowWrap: 'anywhere',
    }),

    filterSummaryActions: {
        display: 'flex',
        alignItems: 'center',
        ml: 'auto',
    },

    actions: {
        p: 1,
        m: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
    },

    applyButton: {
        width: {
            xs: '100%',
            sm: 150,
        },
    },

    tableDivider: commonLayoutSx.divider,
}
