export const filterSidebarSx = {
    title: {
        mt: 3,
    },

    sectionDivider: {
        my: 2,
        mb: 0,
    },

    dateLabel: {
        mt: 1,
    },

    presetGroup: {
        display: 'flex',
        gap: 1,
        flexWrap: 'wrap',
        mt: 2,
    },

    footerDivider: {
        my: 2,
        mb: 1,
    },

    applyContainer: {
        position: 'sticky',
        bottom: 0,
        zIndex: 2,

        pt: 1,
        pb: {
            xs: 'calc(8px + env(safe-area-inset-bottom))',
            sm: 1,
        },

        bgcolor: 'background.paper',
    },

    applyButton: {
        width: '100%',
    },
}
