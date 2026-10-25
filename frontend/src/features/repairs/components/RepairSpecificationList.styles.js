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
            sm: 'minmax(0, 1fr) 120px',
            md: 'minmax(360px, 620px) 120px 150px',
            lg: 'minmax(360px, 620px) 120px 150px 170px 48px',
        },
        gap: 1,
        alignItems: 'center',
        justifyContent: 'start',
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