export const orderFilteringPageSx = {
    page: {
        width: '100%',
        minWidth: 0,
        p: {
            xs: 2,
            sm: 3,
        },
    },

    header: {
        p: {
            xs: 2,
            sm: 3,
        },
        display: 'flex',
        flexDirection: {
            xs: 'column',
            sm: 'row',
        },
        justifyContent: 'space-between',
        alignItems: {
            xs: 'stretch',
            sm: 'center',
        },
        gap: 2,
    },

    title: {
        m: 0,
        minWidth: 0,
        overflowWrap: 'anywhere',
    },

    headerActions: {
        display: 'flex',
        justifyContent: {
            xs: 'flex-start',
            sm: 'flex-end',
        },
        gap: 2,
    },

    filters: {
        display: 'grid',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: {
            xs: 2,
            md: 3,
        },
        pt: 2,
        alignItems: 'start',
        minWidth: 0,
    },

    filterColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
    },

    checkboxGroup: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: {
            xs: 0.5,
            sm: 1,
        },
    },

    checkboxLabel: {
        typography: {
            fontSize: '14px',
            color: 'text.secondary',
        },
    },

    actions: {
        p: 1,
        display: 'flex',
        justifyContent: 'flex-end',
    },

    applyButton: {
        width: {
            xs: '100%',
            sm: 150,
        },
    },

    tableDivider: {
        mb: 3,
    },

    dataGrid: {
        width: '100%',
        minWidth: 0,

        '& .MuiDataGrid-row': {
            cursor: 'pointer',
        },
    },

    exportAction: {
        display: {
            xs: 'none',
            sm: 'block',
        },
    },
}
