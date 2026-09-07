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
        flexDirection: {
            xs: 'column',
            sm: 'row',
        },
        alignItems: {
            xs: 'stretch',
            sm: 'center',
        },
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
        justifyContent: {
            xs: 'flex-start',
            sm: 'flex-end',
        },
        gap: 1,
        ml: {
            xs: 0,
            sm: 'auto',
        },
    },

    divider: {
        mb: 3,
    },
}
