import {
    Box,
    Button,
    Card,
    Divider,
    Typography
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';

import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';


import React from "react";
import ContactRow from "./ContactRow.jsx";

const ContactsListView = ({contacts, onEdit, onDelete, onDeletePhone}) => {
    const tableHeaders = ['Имя', 'Фамилия', 'Должность', 'Email', 'Телефоны', ''];

    return (
        <Card variant="outlined" sx={{width: '100%', borderRadius: 1}}>
            <Box sx={{p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="subtitle1" sx={{
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.9rem'
                }}>
                    Контакты
                </Typography>
                <Button variant="contained" startIcon={<AddIcon/>} sx={{fontWeight: 700}}>
                    Добавить
                </Button>
            </Box>

            <Divider/>

            <TableContainer>
                <Table sx={{minWidth: 800}}>
                    <TableHead sx={{bgcolor: 'action.hover'}}>
                        <TableRow>
                            {tableHeaders.map((head) => (
                                <TableCell key={head}
                                           sx={{fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem'}}>
                                    {head.toUpperCase()}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contacts?.length > 0 ? (
                            contacts.map((contact) => (
                                <ContactRow
                                    key={contact.id}
                                    contact={contact}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onDeletePhone={onDeletePhone}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{py: 3, color: 'text.disabled'}}>
                                    Список контактов пуст
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
};


export default ContactsListView;