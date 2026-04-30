import React from 'react'

import { Button, CircularProgress, Dialog, DialogContent, Stack, Typography } from '@mui/material'

const ConfirmDialog = ({
    open,
    title = 'Confirm action',
    text = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onClose,
    onConfirm,
    loading = false, // 👈
}) => {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Typography variant="h6">{title}</Typography>

                    <Typography variant="body2" color="text.secondary">
                        {text}
                    </Typography>

                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                        <Button onClick={onClose} disabled={loading}>
                            {cancelText}
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={onConfirm}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {confirmText}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    )
}

export default ConfirmDialog
