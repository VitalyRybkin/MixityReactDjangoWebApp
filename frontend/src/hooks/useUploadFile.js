import useSnackbar from './useSnackbar.js'

export function useFileUpload(
    uploadMutation,
    { successMessage = 'Файл успешно загружен.', errorMessage = 'Ошибка загрузки файла.' } = {},
) {
    const { showSnackbar } = useSnackbar()

    return async (id, file) => {
        if (!file) return

        try {
            await uploadMutation.mutateAsync({ id, file })
            showSnackbar(successMessage, 'success')
        } catch {
            showSnackbar(errorMessage, 'error')
        }
    }
}
