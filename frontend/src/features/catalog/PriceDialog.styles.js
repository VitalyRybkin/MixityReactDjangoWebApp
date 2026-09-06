import { layoutSpacing } from '../../styles/layout.styles.js'

export const priceDialogSx = {
    title: {
        px: layoutSpacing.page,
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
        px: layoutSpacing.page,
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
        px: layoutSpacing.page,
        pt: 1,
        pb: 3,
        gap: 1,
    },
}
