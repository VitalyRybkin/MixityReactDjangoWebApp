import { Edit as EditIcon } from '@mui/icons-material'
import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material'

import ContactsListRowPhoneCard from './ui/ContactsListRowPhoneCard.jsx'
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
                    <Tooltip title="Изменить">
                        <span>
                            <IconButton
                                color="primary"
                                onClick={() => onEdit(contact)}
                                disabled={isDeletingContact(contactId)}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Удалить">
                        <span>
                            <IconButton
                                color="error"
                                onClick={() => onDelete(contactId)}
                                disabled={isDeletingContact(contactId)}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ContactsListRow
