import { commonLayoutSx } from './layout.styles.js'

export const filteringPageSx = {
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
