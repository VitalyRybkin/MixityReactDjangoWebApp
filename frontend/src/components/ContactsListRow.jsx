import { Edit as EditIcon } from '@mui/icons-material'
import { Stack, TableCell, TableRow, Typography } from '@mui/material'

import ContactsListRowPhoneCard from './ui/ContactsListRowPhoneCard.jsx'
import DeleteAction from './ui/DeleteAction.jsx'
import EditAction from './ui/EditAction.jsx'
import EmailLink from './ui/EmailLink.jsx'

const ContactsListRow = ({ contact, onEdit, onDelete, onDeletePhone, isDeletingContact, isDeletingPhone }) => {
    const contactId = contact.id

    return (
        <TableRow hover>
            <TableCell>{contact.firstName || '—'}</TableCell>
            <TableCell>{contact.lastName || '—'}</TableCell>
            <TableCell>{contact.position || '—'}</TableCell>

            <TableCell>{contact.email ? <EmailLink email={contact.email} /> : <Typography>—</Typography>}</TableCell>

            <TableCell sx={{ minWidth: 200, py: 1 }}>
                <ContactsListRowPhoneCard
                    contactId={contactId}
                    phoneNumbers={contact.phoneNumbers}
                    onDeletePhone={onDeletePhone}
                    isDeletingPhone={isDeletingPhone}
                    isDeletingContact={isDeletingContact(contactId)}
                />
            </TableCell>

            <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <EditAction
                        title="Изменить"
                        color="primary"
                        disabled={isDeletingContact(contactId)}
                        onClick={() => onEdit(contact)}
                        icon={<EditIcon fontSize="small" />}
                    />
                    <DeleteAction onClick={() => onDelete(contactId)} disabled={isDeletingContact(contactId)} />
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ContactsListRow
