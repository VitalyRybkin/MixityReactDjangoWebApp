export const commonLayoutSx = {
    page: {
        width: '100%',
        minWidth: 0,
        p: {
            xs: 2,
            sm: 3,
        },
    },

    header: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: {
            xs: 2,
            sm: 3,
        },
    },

    headerActions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
        ml: 'auto',
        gap: 1,
    },

    divider: {
        mb: 3,
    },
}