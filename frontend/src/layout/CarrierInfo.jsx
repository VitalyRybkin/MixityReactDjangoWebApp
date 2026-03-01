import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Button,
    Stack,
    Typography,
    Divider,
    DialogTitle,
    Snackbar,
    Alert,
    Dialog, DialogContent, DialogActions
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import api from "../api";
import ContactsListView from "../components/ContactsList";
import EmailLink from "../components/EmailLink.jsx";
import ContactDialog from "../components/ContactDialog.jsx";

const unwrap = (d) => (Array.isArray(d) ? d : (d?.results ?? []));

export default function CarrierInfoPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [carrier, setCarrier] = useState(null);
    const [contacts, setContacts] = useState([]);

    const [dialog, setDialog] = useState({
        open: false,
        mode: "create", // "create" | "edit"
        contact: null,
    });

    const carrierId = Number(id);

    const closeDialog = () => setDialog((s) => ({ ...s, open: false }));

    const openCreateContact = () =>
        setDialog({ open: true, mode: "create", contact: null });

    const openEditContact = (contact) =>
        setDialog({ open: true, mode: "edit", contact });

    const loadCarrier = async () => {
        const res = await api.get(`/api/logistic/carriers/${id}/`);
        setCarrier(res.data);
    };

    const loadContacts = async () => {
        const res = await api.get(`/api/logistic/carriers/${id}/contacts/`);
        setContacts(unwrap(res.data));
    };

    const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });
    const showSnack = (msg, severity = "success") => setSnack({ open: true, severity, msg });

    const [confirm, setConfirm] = useState({ open: false, title: "", text: "", onYes: null });
    const openConfirm = ({ title, text, onYes }) => setConfirm({ open: true, title, text, onYes });
    const closeConfirm = () => setConfirm((s) => ({ ...s, open: false }));

    const [deleting, setDeleting] = useState({
        contactIds: new Set(),            // contacts being deleted
        phoneKeySet: new Set(),           // phones being deleted (key = `${contactId}:${phoneNumber}`)
    });

    const setDeletingContact = (contactId, isOn) => {
        setDeleting((s) => {
            const next = new Set(s.contactIds);
            if (isOn) next.add(contactId);
            else next.delete(contactId);
            return { ...s, contactIds: next };
        });
    };

    const setDeletingPhone = (contactId, phoneNumber, isOn) => {
        const key = `${contactId}:${phoneNumber}`;
        setDeleting((s) => {
            const next = new Set(s.phoneKeySet);
            if (isOn) next.add(key);
            else next.delete(key);
            return { ...s, phoneKeySet: next };
        });
    };

    const isContactDeleting = (contactId) => deleting.contactIds.has(contactId);
    const isPhoneDeleting = (contactId, phoneNumber) => deleting.phoneKeySet.has(`${contactId}:${phoneNumber}`);


    const onDeleteContact = (contactId) => {
        const contact = contacts.find((c) => c.id === contactId);
        openConfirm({
            title: "Удалить контакт?",
            text: `Контакт "${contact?.firstName ?? ""} ${contact?.lastName ?? ""}". Действие необратимо.`,
            onYes: async () => {
                closeConfirm();

                const prev = contacts; // rollback snapshot
                setContacts((cs) => cs.filter((c) => c.id !== contactId));
                setDeletingContact(contactId, true);

                try {
                    await api.delete(`/api/contacts/${contactId}/`);
                    showSnack("Контакт удалён");
                } catch (e) {
                    setContacts(prev); // rollback
                    showSnack(e?.response?.data?.detail || "Не удалось удалить контакт", "error");
                } finally {
                    setDeletingContact(contactId, false);
                }
            },
        });
    };

    const onDeletePhone = async (contactId, phoneNumberToDelete) => {
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) return;

        const prev = contacts; // rollback snapshot

        const nextPhones = (contact.phoneNumbers ?? []).filter((p) => p.phoneNumber !== phoneNumberToDelete);
        setContacts((cs) =>
            cs.map((c) => (c.id === contactId ? { ...c, phoneNumbers: nextPhones } : c))
        );

        setDeletingPhone(contactId, phoneNumberToDelete, true);

        try {
            await api.patch(`/api/contacts/${contactId}/`, { phoneNumbers: nextPhones });
            showSnack("Телефон удалён");
        } catch (e) {
            setContacts(prev); // rollback
            showSnack(e?.response?.data?.detail || "Не удалось удалить телефон", "error");
        } finally {
            setDeletingPhone(contactId, phoneNumberToDelete, false);
        }
    };

    useEffect(() => {
        (async () => {
            await Promise.all([loadCarrier(), loadContacts()]);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);



    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Card variant="outlined" sx={{ width: "100%", borderRadius: 1 }}>
                    <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    color: "text.secondary",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Перевозчик
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/carriers/${id}/edit`)}
                            sx={{ fontWeight: 700, px: 3 }}
                            disabled={!carrier}
                        >
                            Изменить
                        </Button>
                    </Box>

                    <Divider />

                    <CardContent sx={{ p: 0 }}>
                        <Stack>
                            {[
                                { label: "Полное наименование", value: carrier?.fullName },
                                { label: "Адрес", value: carrier?.address },
                                { label: "Телефон", value: carrier?.phone },
                                {
                                    label: "Email",
                                    value: carrier?.email ? (
                                        <EmailLink email={carrier.email} sx={{ fontSize: "1.2rem", lineHeight: 1.1 }} />
                                    ) : null,
                                },
                                { label: "Примечание", value: carrier?.description },
                            ].map((item) => (
                                <Box key={item.label} sx={{ px: 3, py: 2.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            display: "block",
                                            color: "text.disabled",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            mb: 0.5,
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        {item.label}
                                    </Typography>

                                    <Typography variant="h6" sx={{ color: "text.primary", fontSize: "1.2rem", lineHeight: 1.1 }}>
                                        {item.value || "—"}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                <ContactsListView
                    contacts={contacts}
                    onAdd={openCreateContact}
                    onEdit={openEditContact}
                    onDelete={onDeleteContact}
                    onDeletePhone={onDeletePhone}
                    isDeletingPhone={isPhoneDeleting}
                    isDeletingContact={isContactDeleting}
                />
            </Stack>

            <ContactDialog
                open={dialog.open}
                mode={dialog.mode}
                ownerType="carrier"
                ownerId={carrierId}
                initialData={dialog.contact}
                onClose={closeDialog}
                onSaved={async () => {
                    await loadContacts();
                    closeDialog();
                }}
            />

            <Dialog open={confirm.open} onClose={closeConfirm}>
                <DialogTitle>{confirm.title}</DialogTitle>
                <DialogContent>{confirm.text}</DialogContent>
                <DialogActions>
                    <Button onClick={closeConfirm}>Отмена</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => confirm.onYes?.()}
                    >
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snack.open}
                autoHideDuration={2500}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={snack.severity}
                    onClose={() => setSnack((s) => ({ ...s, open: false }))}
                    variant="filled"
                >
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>

    );
}