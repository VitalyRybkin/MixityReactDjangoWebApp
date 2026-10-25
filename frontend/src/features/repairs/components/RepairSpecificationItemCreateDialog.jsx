import {firstError} from "../../../utils/apiError.js";
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@mui/material";
import {useEffect, useState} from "react";

export default function RepairSpecificationItemCreateDialog({
                                                                open,
                                                                title,
                                                                label,
                                                                mutation,
                                                                errorMessage,
                                                                onClose,
                                                                onCreated,
                                                            }) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const saving = mutation.isPending

    useEffect(() => {
        if (!open) {
            return
        }

        setName('')
        setError('')
    }, [open])

    const handleSubmit = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        const value = name.trim()

        if (!value) {
            return
        }

        setError('')

        try {
            const created = await mutation.mutateAsync({
                name: value,
            })

            onCreated(created)
        } catch (err) {
            setError(
                firstError(err) ||
                errorMessage ||
                'Не удалось добавить запись',
            )
        }
    }

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="xs"
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle>{title}</DialogTitle>

                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        fullWidth
                        required
                        label={label}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={onClose}
                        disabled={saving}
                    >
                        Отмена
                    </Button>

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving || !name.trim()}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}