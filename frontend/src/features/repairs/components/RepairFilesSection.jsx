import { useRef } from 'react'

import AttachFileIcon from '@mui/icons-material/AttachFile'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Box, CircularProgress, IconButton, Link, Stack, Typography } from '@mui/material'

import DeleteAction from '../../../components/ui/buttons/DeleteAction.jsx'

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

    const handleSelectFile = async (event) => {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        await onUpload(file)

        event.target.value = ''
    }

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {title}
                </Typography>

                <IconButton
                    size="small"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || uploading}
                    aria-label="Добавить файл"
                >
                    {uploading ? <CircularProgress size={18} /> : <AttachFileIcon fontSize="small" />}
                </IconButton>

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
                                {file.file_name || `Файл ${file.id}`}
                            </Link>

                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <IconButton
                                    component="a"
                                    href={file.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    aria-label="Открыть файл"
                                >
                                    <OpenInNewIcon fontSize="small" />
                                </IconButton>

                                <DeleteAction onClick={() => onDelete(file.id)} disabled={deletingId === file.id} />
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            )}
        </Box>
    )
}
