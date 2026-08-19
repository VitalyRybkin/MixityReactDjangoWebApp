import { useRef, useState } from 'react'

import { Box } from '@mui/material'

import useSnackbar from '../hooks/useSnackbar.js'

import DeleteFileAction from './ui/buttons/DeleteFileAction.jsx'
import UploadAction from './ui/buttons/UploadAction.jsx'
import ViewAction from './ui/buttons/ViewAction.jsx'
import ConfirmDialog from './ui/feedback/ConfirmDialog.jsx'

export default function FileUploadAction({
    entityId,
    fileUrl,
    onUpload,
    onView,
    uploadTitle = 'Загрузить файл',
    viewTitle = 'Просмотр файла',
    deleteTitle = 'Удалить файл',
    accept = 'application/pdf',
    disabled = false,
}) {
    const fileInputRef = useRef(null)

    const [pendingAction, setPendingAction] = useState(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    const isUploading = pendingAction === 'upload'
    const isDeleting = pendingAction === 'delete'
    const isPending = pendingAction !== null

    const handleSelectClick = (event) => {
        event.stopPropagation()

        if (!isPending) {
            fileInputRef.current?.click()
        }
    }

    const handleViewClick = async (event) => {
        event.stopPropagation()

        if (onView) {
            await onView(entityId)
        }
    }

    const handleDeleteClick = (event) => {
        event.stopPropagation()
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        try {
            setPendingAction('delete')
            await onUpload(entityId, null)

            setDeleteConfirmOpen(false)
        } finally {
            setPendingAction(null)
        }
    }

    const handleChange = async (event) => {
        event.stopPropagation()

        const file = event.target.files?.[0]

        try {
            if (file) {
                setPendingAction('upload')
                await onUpload(entityId, file)
            }
        } finally {
            setPendingAction(null)
            event.target.value = ''
        }
    }

    return (
        <div onClick={(event) => event.stopPropagation()}>
            <input
                ref={fileInputRef}
                hidden
                type="file"
                accept={accept}
                disabled={disabled || isPending}
                onClick={(event) => event.stopPropagation()}
                onChange={handleChange}
            />

            {fileUrl ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <ViewAction title={viewTitle} disabled={disabled || isPending} onClick={handleViewClick} />

                    <DeleteFileAction
                        title={deleteTitle}
                        loading={isDeleting}
                        disabled={disabled}
                        onClick={handleDeleteClick}
                    />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <UploadAction
                        title={uploadTitle}
                        loading={isUploading}
                        disabled={disabled}
                        onClick={handleSelectClick}
                    />
                </Box>
            )}

            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Удалить файл?"
                text="Файл будет удалён без возможности восстановления."
                confirmText={isDeleting ? 'Удаление...' : 'Удалить'}
                cancelText="Отмена"
                onClose={() => {
                    if (!isDeleting) {
                        setDeleteConfirmOpen(false)
                    }
                }}
                onConfirm={handleConfirmDelete}
                loading={isDeleting}
            />
        </div>
    )
}
