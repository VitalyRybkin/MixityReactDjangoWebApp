import { useEffect, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import { Box, Card, CardHeader, CardContent, Button, Stack, Typography, Divider } from "@mui/material";
import api from "../api";
import ContactDialog from "../components/ContactDialog";
import { Edit as EditIcon } from '@mui/icons-material';


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
    const navigate = useNavigate();
    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Card variant="outlined" sx={{ width: '100%', borderRadius: 1 }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.9rem' }}>
                                Перевозчик
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
                                {carrier?.fullName ?? carrier?.name ?? "Данные не заполнены"}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/carriers/${carrier.id}/edit`)}
                            sx={{ fontWeight: 700, px: 3 }}
                        >
                            Изменить
                        </Button>
                    </Box>

                    <Divider />

                    <CardContent sx={{ p: 0 }}>
                        <Stack>
                            {[
                                { label: 'Полное наименование', value: carrier?.fullName },
                                { label: 'Адрес', value: carrier?.address },
                                { label: 'Телефон', value: carrier?.phone },
                                { label: 'Email', value: carrier?.email },
                                { label: 'Примечание', value: carrier?.description },
                            ].map((item) => (
                                <Box key={item.label} sx={{ px: 3, py: 2.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ display: 'block', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', mb: .5, fontSize: '0.85rem' }}
                                    >
                                        {item.label}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '1.2rem', lineHeight: 1.1 }}>
                                        {item.value || "—"}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
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