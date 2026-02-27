import {useEffect, useState} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Alert,
    IconButton,
    Typography,
    Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api";

const emptyPhone = () => ({phoneNumber: ""});
const safeStr = (v) => (v ?? "");

export default function ContactDialog({
                                          open,
                                          mode,
                                          ownerType,
                                          ownerId,
                                          initialData, // contact object for edit (can be null)
                                          onClose,
                                          onSaved,
                                      }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        position: "",
        email: "",
        phoneNumbers: [emptyPhone()],
    });

    useEffect(() => {
        if (!open) return;

        setError("");
        setSaving(false);

        if (mode === "edit" && initialData) {
            setForm({
                firstName: safeStr(initialData.firstName),
                lastName: safeStr(initialData.lastName),
                position: safeStr(initialData.position),
                email: safeStr(initialData.email),
                phoneNumbers:
                    (initialData.phoneNumbers?.length ? initialData.phoneNumbers : [emptyPhone()]).map((p) => ({
                        phoneNumber: safeStr(p.phoneNumber),
                    })),
            });
        } else {
            setForm({
                firstName: "",
                lastName: "",
                position: "",
                email: "",
                phoneNumbers: [emptyPhone()],
            });
        }
    }, [open, mode, initialData]);

    const onChange = (field) => (e) => setForm((p) => ({...p, [field]: e.target.value}));

    const addPhone = () => setForm((p) => ({...p, phoneNumbers: [...p.phoneNumbers, emptyPhone()]}));

    const removePhone = (idx) =>
        setForm((p) => ({
            ...p,
            phoneNumbers: p.phoneNumbers.length === 1 ? [emptyPhone()] : p.phoneNumbers.filter((_, i) => i !== idx),
        }));

    const changePhone = (idx) => (e) => {
        const value = e.target.value;
        setForm((p) => ({
            ...p,
            phoneNumbers: p.phoneNumbers.map((ph, i) => (i === idx ? {...ph, phoneNumber: value} : ph)),
        }));
    };

    const buildPayload = () => {
        const id = Number(ownerId);

        const owner =
            ownerType === "warehouse"
                ? { warehouse: id, carrier: null }
                : { carrier: id, warehouse: null };

        const phones = (form.phoneNumbers ?? [])
            .map((p) => ({ phoneNumber: safeStr(p.phoneNumber).trim() }))
            .filter((p) => p.phoneNumber.length > 0);

        return {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim() || "",
            position: form.position.trim() || null,
            email: form.email.trim() || null,
            phoneNumbers: phones,
            ...owner,
        };
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (mode === "create") {
                await api.post("/api/contacts/", buildPayload);
            } else {
                const editPayload = {...buildPayload};
                delete editPayload.carrier;
                delete editPayload.warehouse;

                await api.patch(`/api/contacts/${initialData.id}/`, editPayload);
            }

            await onSaved();
        } catch (err) {
            const data = err?.response?.data;

            if (data && typeof data === "object") {
                const firstKey = Object.keys(data)[0];
                const val = data[firstKey];

                // Example: phoneNumbers: [{phoneNumber: ["..."]}]
                if (firstKey === "phoneNumbers" && Array.isArray(val) && val[0]?.phoneNumber) {
                    setError(`phoneNumbers: ${val[0].phoneNumber[0]}`);
                } else {
                    const msg =
                        firstKey
                            ? `${firstKey}: ${Array.isArray(val) ? val[0] : typeof val === "string" ? val : "Invalid"}`
                            : "Save failed";
                    setError(msg);
                }
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
                <Stack component="form" onSubmit={submit} spacing={2} sx={{mt: 1}}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField label="Имя" value={form.firstName} onChange={onChange("firstName")} fullWidth/>
                    <TextField label="Фамилия" value={form.lastName} onChange={onChange("lastName")} fullWidth/>
                    <TextField label="Должность" value={form.position} onChange={onChange("position")} fullWidth/>
                    <TextField label="Email" value={form.email} onChange={onChange("email")} fullWidth/>

                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{mb: 1}}>
                            <Typography variant="subtitle1">Телефоны</Typography>
                            <Button size="small" startIcon={<AddIcon/>} onClick={addPhone} disabled={saving}>
                                Добавить
                            </Button>
                        </Stack>

                        <Stack spacing={1}>
                            {form.phoneNumbers.map((p, idx) => (
                                <Stack key={idx} direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        label={`Телефон ${idx + 1}`}
                                        value={p.phoneNumber}
                                        onChange={changePhone(idx)}
                                        fullWidth
                                    />
                                    <IconButton onClick={() => removePhone(idx)} disabled={saving}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    {/* allow Enter submit */}
                    <button type="submit" style={{display: "none"}}/>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    Отмена
                </Button>
                <Button onClick={submit} variant="contained" disabled={saving}>
                    {saving ? "Сохранение..." : "Сохранить"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}