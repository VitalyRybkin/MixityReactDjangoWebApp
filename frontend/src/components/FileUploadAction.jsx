import { useRef } from 'react'

import DownAction from './ui/buttons/DownAction.jsx'
import ViewAction from './ui/buttons/ViewAction.jsx'

export default function FileUploadAction({
    entityId,
    fileUrl,
    onUpload,
    uploadTitle = 'Загрузить файл',
    viewTitle = 'Просмотр файла',
    accept = 'application/pdf',
    disabled = false,
}) {
    const fileInputRef = useRef(null)

    const handleSelectClick = (event) => {
        event.stopPropagation()
        fileInputRef.current?.click()
    }

    const handleViewClick = (event) => {
        event.stopPropagation()
        window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }

    const handleChange = async (event) => {
        event.stopPropagation()

        const file = event.target.files?.[0]

        try {
            if (file) {
                await onUpload(entityId, file)
            }
        } finally {
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
                onClick={(event) => event.stopPropagation()}
                onChange={handleChange}
            />

            {fileUrl ? (
                <ViewAction title={viewTitle} onClick={handleViewClick} />
            ) : (
                <DownAction title={uploadTitle} disabled={disabled} onClick={handleSelectClick} />
            )}
        </div>
    )
}
