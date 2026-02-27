import {IconButton, Stack, TableCell, TableRow, Tooltip, Typography} from "@mui/material";
import PhoneList from "./PhoneList.jsx";
import DeleteIcon from "@mui/icons-material/Delete";
import {Edit as EditIcon} from "@mui/icons-material";
import EmailLink from "./EmailLink.jsx";

const ContactRow = ({contact, onEdit, onDelete, onDeletePhone}) => (
    <TableRow hover>
        <TableCell>{contact.firstName || "—"}</TableCell>
        <TableCell>{contact.lastName || "—"}</TableCell>
        <TableCell>{contact.position || "—"}</TableCell>
        <TableCell>
            {contact.email ? (
                <EmailLink email={contact.email}/>
            ) : (
                <Typography>—</Typography>
            )}
        </TableCell>
        <TableCell sx={{minWidth: 200, py: 1}}>
            <PhoneList
                contactId={contact.id}
                phoneNumbers={contact.phoneNumbers}
                onDeletePhone={onDeletePhone}
            />
        </TableCell>
        <TableCell align="right">
            <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Редактировать контакт">
                    <IconButton color="primary" onClick={() => onEdit(contact)}>
                        <EditIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Удалить контакт">
                    <IconButton color="error" onClick={() => onDelete(contact.id)}>
                        <DeleteIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Stack>
        </TableCell>
    </TableRow>
);

export default ContactRow;
