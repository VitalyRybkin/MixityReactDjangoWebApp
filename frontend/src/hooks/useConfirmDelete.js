import { useCallback } from 'react'

import { firstError } from '../utils/apiError.js'

export const useConfirmDelete = ({ askConfirm, showSnackbar }) => {
    return useCallback(
        ({
            item,
            mutateAsync,
            refetch,
            getId = (entity) => entity.id,
            getName = (entity) => entity.name,
            title = 'Удалить объект?',
            text,
            confirmText = 'Удалить',
            cancelText = 'Отмена',
            confirmColor = 'error',
            successMessage = 'Объект удален',
            errorMessage = 'Ошибка удаления!',
            onSuccess,
            onError,
        }) => {
            askConfirm({
                title,
                text:
                    typeof text === 'function'
                        ? text(item)
                        : (text ?? `Вы действительно хотите удалить "${getName(item)}"?`),
                confirmText,
                cancelText,
                confirmColor,
                onConfirm: async () => {
                    try {
                        await mutateAsync(getId(item))
                        showSnackbar(successMessage, 'success')

                        if (onSuccess) {
                            await onSuccess(item)
                            return
                        }

                        await refetch?.()
                    } catch (error) {
                        console.error('Delete error:', error)

                        if (onError) {
                            await onError(error, item)
                            return
                        }

                        showSnackbar(firstError(error) || errorMessage, 'error')
                    }
                },
            })
        },
        [askConfirm, showSnackbar],
    )
}
