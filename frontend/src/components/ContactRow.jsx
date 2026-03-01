import {IconButton, Stack, TableCell, TableRow, Tooltip, Typography} from "@mui/material";
import PhoneList from "./PhoneList.jsx";
import DeleteIcon from "@mui/icons-material/Delete";
import {Edit as EditIcon} from "@mui/icons-material";
import EmailLink from "./EmailLink.jsx";

const ContactRow = ({  contact, onEdit, onDelete, onDeletePhone, isDeletingContact, isDeletingPhone }) => {
    const contactId = contact.id;

    return (
        <TableRow hover>
            <TableCell>{contact.firstName || "—"}</TableCell>
            <TableCell>{contact.lastName || "—"}</TableCell>
            <TableCell>{contact.position || "—"}</TableCell>

            <TableCell>
                {contact.email ? <EmailLink email={contact.email} /> : <Typography>—</Typography>}
            </TableCell>

            <TableCell sx={{ minWidth: 200, py: 1 }}>
                <PhoneList
                    contactId={contactId}
                    phoneNumbers={contact.phoneNumbers}
                    onDeletePhone={onDeletePhone}
                    isDeletingPhone={isDeletingPhone}
                    isDeletingContact={isDeletingContact(contactId)}
                />
            </TableCell>

            <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Редактировать контакт">
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

                    <Tooltip title="Удалить контакт">
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
    );
};

export default ContactRow;
