export const repairPartsListSx = {
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
        py: 0.5,
        px: 0,
        minWidth: 0,
    },

    fields: {
        display: 'grid',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'minmax(260px, 1.8fr) 105px 130px auto 48px',
        },
        gap: 1,
        alignItems: 'center',
        minWidth: 0,
    },

    partField: {
        minWidth: 0,
    },

    quantityField: {
        minWidth: 0,
        width: '100%',
    },

    priceField: {
        minWidth: 0,
        width: '100%',
    },

    deleteAction: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 48,
    },

    rebillableField: {
        m: 0,
        whiteSpace: 'nowrap',

        '& .MuiFormControlLabel-label': {
            fontSize: '0.9rem',
        },

        '& .MuiCheckbox-root': {
            p: 0.5,
            mr: 0.5,
        },
    },
}
