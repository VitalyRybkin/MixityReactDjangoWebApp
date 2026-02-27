import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Card, CardContent, Button, Stack, Typography, Divider } from "@mui/material";
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

    const onDeleteContact = async (contactId) => {
        await api.delete(`/api/contacts/${contactId}/`);
        await loadContacts();
    };

    const onDeletePhone = async (contactId, phoneNumberToDelete) => {
        const contact = contacts.find((c) => c.id === contactId);
        if (!contact) return;

        const newPhones = (contact.phoneNumbers ?? []).filter(
            (p) => p.phoneNumber !== phoneNumberToDelete
        );

        await api.patch(`/api/contacts/${contactId}/`, { phoneNumbers: newPhones });
        await loadContacts();
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
                    onEdit={openEditContact}
                    onAdd={openCreateContact}
                    onDelete={onDeleteContact}
                    onDeletePhone={onDeletePhone}
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
        </Box>
    );
}