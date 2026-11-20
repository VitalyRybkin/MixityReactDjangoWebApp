import { Edit as EditIcon } from '@mui/icons-material'
import { Stack, TableCell, TableRow, Typography } from '@mui/material'

import ContactsListRowPhoneCard from './ContactsListRowPhoneCard.jsx'
import DeleteAction from './ui/buttons/DeleteAction.jsx'
import EditAction from './ui/buttons/EditAction.jsx'
import EmailLink from './ui/buttons/EmailLink.jsx'

const ContactsListRow = ({ contact, onEdit, onDelete, onDeletePhone, isDeletingContact, isDeletingPhone }) => {
    const contactId = contact.id
    // Editing snapshots the entire contact, including phoneNumbers. Do not open
    // Edit while a full-array phone deletion is in flight.
    const isDeletingAnyPhone = (contact.phoneNumbers ?? []).some((phone) =>
        isDeletingPhone(contactId, phone.phoneNumber),
    )
    const isRowBusy = isDeletingContact(contactId) || isDeletingAnyPhone

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
                        disabled={isRowBusy}
                        onClick={() => onEdit(contact)}
                        icon={<EditIcon fontSize="small" />}
                    />
                    <DeleteAction onClick={() => onDelete(contactId)} disabled={isRowBusy} />
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ContactsListRow
