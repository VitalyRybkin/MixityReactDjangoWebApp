import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Card, CardHeader, CardContent, Button, Stack, Typography, Divider } from "@mui/material";
import api from "../api";
import ContactDialog from "../components/ContactDialog";

const unwrap = (d) => (Array.isArray(d) ? d : (d?.results ?? []));

export default function CarrierInfoPage() {
    const { id } = useParams();

    const [carrier, setCarrier] = useState(null);
    const [contacts, setContacts] = useState([]);

    const [contactDialog, setContactDialog] = useState({ open: false, mode: "create", contact: null });

    const loadCarrier = async () => {
        const res = await api.get(`/api/logistic/carriers/${id}/`);
        setCarrier(res.data);
    };

    const loadContacts = async () => {
        const res = await api.get(`/api/logistic/carriers/${id}/contacts/`);
        setContacts(unwrap(res.data));
    };

    useEffect(() => {
        (async () => {
            await Promise.all([loadCarrier(), loadContacts()]);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const openCreateContact = () => setContactDialog({ open: true, mode: "create", contact: null });
    const openEditContact = (contact) => setContactDialog({ open: true, mode: "edit", contact });

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Card>
                    <CardHeader title={`Перевозчик: ${carrier?.fullName ?? carrier?.name ?? ""}`} />
                    <CardContent>
                        <Typography>Email: {carrier?.email ?? "-"}</Typography>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Контакты"
                        action={<Button onClick={openCreateContact}>Добавить</Button>}
                    />
                    <CardContent>
                        {contacts.map((c) => (
                            <Box key={c.id} sx={{ py: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography fontWeight={600}>{c.fullName ?? c.name ?? "—"}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {c.phone ?? ""} {c.email ? `• ${c.email}` : ""}
                                        </Typography>
                                    </Box>
                                    <Button size="small" onClick={() => openEditContact(c)}>Изменить</Button>
                                </Stack>
                                <Divider sx={{ mt: 1 }} />
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            </Stack>

            <ContactDialog
                open={contactDialog.open}
                mode={contactDialog.mode}
                carrierId={id}
                initialData={contactDialog.contact}
                onClose={() => setContactDialog((s) => ({ ...s, open: false }))}
                onSaved={async () => {
                    // simplest reliable way:
                    await loadContacts();
                    setContactDialog((s) => ({ ...s, open: false }));
                }}
            />
        </Box>
    );
}