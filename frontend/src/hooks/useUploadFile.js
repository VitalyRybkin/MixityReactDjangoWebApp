export function useFileUpload(
    uploadMutation,
    showSnackbar,
    {
        successMessage = 'Файл успешно загружен.',
        deleteSuccessMessage = 'Файл успешно удалён.',
        errorMessage = 'Ошибка загрузки файла.',
    } = {},
) {
    return async (id, file) => {
        try {
            await uploadMutation.mutateAsync({ id, file })

            showSnackbar(file === null ? deleteSuccessMessage : successMessage, 'success')
        } catch {
            showSnackbar(errorMessage, 'error')
        }
    }
}
