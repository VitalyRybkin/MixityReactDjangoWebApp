export const objectListViewRowSx = {
    row: {
        cursor: 'pointer',

        '& td': {
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
        },
    },

    titleCell: {
        width: {
            xs: 140,
            sm: 180,
            md: 220,
        },

        maxWidth: {
            xs: 140,
            sm: 180,
            md: 220,
        },

        fontWeight: 600,
        verticalAlign: 'middle',
    },

    detailsCell: {
        color: 'text.secondary',
        verticalAlign: 'middle',
    },

    details: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        width: '100%',
    },

    detailsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        width: '100%',
    },

    detail: {
        color: 'text.secondary',
    },

    actionsCell: {
        width: 100,
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
    },
}
