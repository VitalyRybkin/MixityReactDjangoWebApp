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
        color: 'primary.main',
    },

    divider: {
        my: 1,
    },

    warehouseField: {
        mt: 1,
    },
}