export const orderMainFieldsSx = {
    fieldset: {
        width: '100%',
        minWidth: 0,
    },

    legend: {
        px: 1,
        color: 'text.secondary',
        fontWeight: 'medium',
    },

    fields: {
        flex: 1,
        minWidth: 0,
    },

    fieldRow: {
        display: 'flex',
        flexDirection: {
            xs: 'column',
            sm: 'row',
        },
        gap: 2,
        alignItems: {
            xs: 'stretch',
            sm: 'center',
        },
        minWidth: 0,
    },

    field: {
        flex: 1,
        width: '100%',
        minWidth: 0,
    },

    actions: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mt: 2,
        mb: 1,
        minWidth: 0,
    },

    checkboxLabel: {
        fontSize: '0.9rem',
        color: 'text.secondary',
    },
}
