import { useRef, useState } from 'react'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, CircularProgress, IconButton, Link, Stack, TextField, Typography } from '@mui/material'

import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'
import UploadAction from '../../../components/ui/buttons/UploadAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'

export default function RepairFilesSection({
    title,
    files = [],
    onUpload,
    onDelete,
    uploading = false,
    deletingId = null,
    disabled = false,
}) {
    const inputRef = useRef(null)
    const [fileName, setFileName] = useState('')

    const handleSelectFile = async (event) => {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        await onUpload({
            file,
            fileName,
        })

        setFileName('')
        event.target.value = ''
    }

    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {title}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <TextField
                    size="small"
                    placeholder="Название файла"
                    value={fileName}
                    onChange={(event) => setFileName(event.target.value)}
                    disabled={disabled || uploading}
                    fullWidth
                />

                <UploadAction
                    loading={uploading}
                    disabled={disabled || !fileName.trim()}
                    onClick={() => inputRef.current?.click()}
                    title="Загрузить файл"
                />

                <input ref={inputRef} type="file" hidden accept=".pdf,.jpg,.jpeg" onChange={handleSelectFile} />
            </Stack>

            {files.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Файлы не загружены
                </Typography>
            ) : (
                <Stack spacing={0.5}>
                    {files.map((file) => (
                        <Stack
                            key={file.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                        >
                            <Link
                                href={file.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                sx={{
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Stack spacing={0.5}>{file.file_name || `Файл ${file.id}`}</Stack>
                            </Link>

                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <ViewAction component="a" href={file.file} target="_blank" rel="noopener noreferrer" />
                                <DeleteAction onClick={() => onDelete(file.id)} disabled={deletingId === file.id} />
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            )}
        </Box>
    )
}
