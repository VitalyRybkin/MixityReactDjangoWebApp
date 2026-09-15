import { fieldsetStyles } from '../utils/order.form.constants.js'

export const orderDetailSideBarSx = {
    section: {
        ...fieldsetStyles,
        bgcolor: 'background.default',
        gap: 0,
        mb: 1,
        flex: 0,
    },

    title: {
        color: '#fc9e34',
    },

    negative: {
        color: 'error.main',
    },

    divider: {
        my: 1,
    },

    warehouseField: {
        mt: 1,
    },

    total: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'primary.main',
    },
}
