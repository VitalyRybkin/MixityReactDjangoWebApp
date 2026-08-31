import { entityFormSx } from '../../../styles/entityForm.styles.js'

export const carrierTruckFormSx = {
    ...entityFormSx,

    selectorRow: {
        minWidth: 0,

        '& .MuiFormControl-root': {
            minWidth: 0,
        },
    },

    addButton: {
        mt: 1,
        flexShrink: 0,
    },
}
