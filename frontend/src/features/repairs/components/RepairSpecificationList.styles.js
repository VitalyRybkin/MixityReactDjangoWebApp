export const repairSpecificationListSx = {
    emptyText: {
        px: 1,
        py: 1,
        color: 'text.secondary',
    },

    row: {
        py: 0.75,
        minWidth: 0,
        maxWidth: 1250,
    },

    fields: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr',
            md: 'minmax(280px, 1fr) 48px 140px 160px auto 48px',
        },
        gap: 0.75,
        alignItems: 'center',
        minWidth: 0,
    },

    partField: {
        minWidth: 0,
        width: '100%',
    },

    quantityField: {
        width: '100%',
        minWidth: 0,
    },

    priceField: {
        width: '100%',
        minWidth: 0,
    },

    rebillableField: {
        m: 0,
        whiteSpace: 'nowrap',
        minWidth: 160,
    },

    deleteAction: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
    },

    totalFooter: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 1.5,
        py: 1,
        px: 1,
        flexWrap: 'wrap',
    },

    totalValue: {
        color: 'warning.main',
        fontWeight: 700,
    },
}