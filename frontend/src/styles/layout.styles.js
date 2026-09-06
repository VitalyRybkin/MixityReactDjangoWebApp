export const layoutSpacing = {
    page: {
        xs: 2,
        sm: 3,
    },

    gap: 2,
    largeGap: 3,
}

export const commonLayoutSx = {
    page: {
        width: '100%',
        minWidth: 0,
        p: layoutSpacing.page,
    },

    pageHorizontal: {
        width: '100%',
        minWidth: 0,
        px: layoutSpacing.page,
    },

    header: {
        p: layoutSpacing.page,
    },

    divider: {
        mb: 3,
    },

    sectionTitle: {
        fontWeight: 600,
    },
}
