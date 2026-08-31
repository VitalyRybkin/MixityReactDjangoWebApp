export const orderProductsListSx = {
    header: {
        p: 1,
        mt: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
    },

    divider: {
        mb: 1,
    },

    emptyText: {
        px: 1,
    },

    row: {
        p: {
            xs: 0,
            sm: 0.5,
        },
        minWidth: 0,
    },

    fields: {
        display: 'grid',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'minmax(240px, 2fr) minmax(170px, 0.7fr) minmax(240px, 1.5fr) auto',
        },
        gap: 1.5,
        alignItems: 'center',
        minWidth: 0,
    },

    productField: {
        minWidth: 0,
    },

    quantityGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
    },

    quantityField: {
        flex: 1,
        minWidth: 0,
    },

    unit: {
        width: 55,
        flexShrink: 0,
        color: 'text.secondary',
    },

    packField: {
        minWidth: 0,
        width: '100%',
    },

    deleteAction: {
        display: 'flex',
        justifyContent: {
            xs: 'flex-end',
            sm: 'flex-end',
            lg: 'center',
        },
    },
}