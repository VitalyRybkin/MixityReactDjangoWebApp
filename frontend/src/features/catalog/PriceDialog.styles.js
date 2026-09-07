import { commonLayoutSx } from '../../styles/layout.styles.js'

export const priceDialogSx = {
    title: {
        px: commonLayoutSx.page,
        pt: 3,
        pb: 2,
        fontSize: {
            xs: '1.3rem',
            sm: '1.55rem',
        },
        fontWeight: 600,
    },

    divider: {
        my: 1,
    },

    content: {
        px: commonLayoutSx.page,
        pt: 2,
        pb: 3,
    },

    stack: {
        gap: 3,
    },

    entityName: {
        fontSize: {
            xs: '1.15rem',
            sm: '1.35rem',
        },
        fontWeight: 600,
        color: 'text.secondary',
    },

    field: {
        '& .MuiInputBase-root': {
            minHeight: 56,
        },
    },

    actions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,

        px: {
            xs: 2,
            sm: 3,
        },

        pt: 1,
        pb: 3,
    },

    formActions: {
        ml: 'auto',
    },
}
