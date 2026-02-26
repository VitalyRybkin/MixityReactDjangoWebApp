import { useEffect, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, Alert
} from "@mui/material";
import api from "../api";

export default function ContactDialog({
                                          open,
                                          mode, // "create" | "edit"
                                          carrierId,
                                          initialData, // contact object for edit
                                          onClose,
                                          onSaved,
                                      }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        description: "",
    });

    useEffect(() => {
        if (!open) return;

        setError("");
        setSaving(false);

        if (mode === "edit" && initialData) {
            setForm({
                fullName: initialData.fullName ?? initialData.name ?? "",
                phone: initialData.phone ?? "",
                email: initialData.email ?? "",
                description: initialData.description ?? "",
            });
        } else {
            setForm({ fullName: "", phone: "", email: "", description: "" });
        }
    }, [open, mode, initialData]);

    const onChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (mode === "create") {
                await api.post(`/api/carriers/${carrierId}/contacts/`, form);
            } else {
                // IMPORTANT: replace with your real contact update endpoint
                await api.patch(`/api/contacts/${initialData.id}/`, form);
            }
            await onSaved();
        } catch (err) {
            const data = err?.response?.data;
            if (data && typeof data === "object") {
                const firstKey = Object.keys(data)[0];
                const msg =
                    firstKey
                        ? `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]}`
                        : "Save failed";
                setError(msg);
            } else {
                setError(err?.message || "Save failed");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>{mode === "create" ? "Добавить контакт" : "Редактировать контакт"}</DialogTitle>

            <DialogContent>
                <Stack component="form" onSubmit={submit} spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField label="ФИО" value={form.fullName} onChange={onChange("fullName")} fullWidth />
                    <TextField label="Телефон" value={form.phone} onChange={onChange("phone")} fullWidth />
                    <TextField label="Email" value={form.email} onChange={onChange("email")} fullWidth />
                    <TextField
                        label="Примечание"
                        value={form.description}
                        onChange={onChange("description")}
                        fullWidth
                        multiline
                        minRows={3}
                    />

                    {/* hidden submit so Enter works */}
                    <button type="submit" style={{ display: "none" }} />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Отмена</Button>
                <Button onClick={submit} variant="contained" disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}