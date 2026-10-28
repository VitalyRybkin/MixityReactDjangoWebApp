import { commonLayoutSx } from '../../styles/layout.styles.js'

export const repairRequestFormSx = {
    form: {
        minWidth: 0,
    },

    header: {
        minWidth: 0,
    },

    legend: {
        px: 1,
        color: 'text.secondary',
        fontWeight: 'medium',
    },

    field: {
        flex: 1,
        width: '100%',
        minWidth: 0,
    },

    fieldRow: {
        display: 'flex',
        flexDirection: {
            xs: 'column',
            sm: 'row',
        },
        gap: 2,
        alignItems: 'stretch',
        minWidth: 0,
    },

    mainFields: {
        display: 'flex',
        flexDirection: {
            xs: 'column',
            md: 'row',
        },
        alignItems: 'stretch',
        gap: 2,
        minWidth: 0,

        '& > *': {
            minWidth: 0,
            width: {
                xs: '100%',
                md: 'auto',
            },
            flex: {
                md: 1,
            },
        },
    },

    filesTitle: {
        mb: 1,
        color: 'text.secondary',
        fontWeight: 'medium',
    },

    note: {
        mt: 2,
        width: {
            xs: '100%',
            md: 440,
        },
        maxWidth: '100%',
    },

    divider: commonLayoutSx.divider,

    bottomDivider: {
        mb: 1,
        mt: 2,
    },

    loading: {
        py: 6,
        display: 'flex',
        justifyContent: 'center',
    },

    products: {
        minWidth: 0,
        width: '100%',
    },

    weight: {
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },

    weightLabel: {
        m: 1,
    },

    formColumns: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(320px, 440px) minmax(320px, 440px) minmax(360px, 1fr)',
        },
        gap: 3,
        alignItems: 'stretch',
        width: '100%',
        minWidth: 0,
        mb: 2,
    },

    fieldset: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
    },

    fields: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
    },

    filesSection: {
        mt: 'auto',
        pt: 2,
        minHeight: 145,
    },

    descriptionField: {
        flex: 1,
        minWidth: 0,

        '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
        },

        '& textarea': {
            height: '100% !important',
            overflow: 'auto',
        },
    },

    descriptionColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        height: '100%',
    },

    descriptionHalf: {
        flex: 1,
        minHeight: 0,

        '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
        },

        '& textarea': {
            height: '100% !important',
            overflow: 'auto',
        },
    },

    specificationSection: {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        mb: 2,
        minWidth: 0,
        '&:hover': {
            borderColor: 'text.secondary',
        },
    },

    specificationHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        mb: 1.5,
    },

    specificationTotal: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
        mt: 1.5,
        flexWrap: 'wrap',
    },

    specificationGrandTotal: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 1.5,
        px: 2,
        py: 1.5,
        mt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
    },

    specificationGrandTotalValue: {
        color: 'warning.main',
        fontWeight: 700,
    },
}

export const fieldsetStyles = {
    flex: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    p: 2,
    m: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2.1,
    '&:hover': {
        borderColor: 'text.secondary',
    },
}
