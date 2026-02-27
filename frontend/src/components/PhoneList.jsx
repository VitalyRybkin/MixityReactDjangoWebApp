import {Box, IconButton, Stack, Tooltip, Typography} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const PhoneList = ({contactId, phoneNumbers, onDeletePhone}) => (
    <Stack spacing={0.5}>
        {phoneNumbers?.map((phone, idx) => (
            <Box
                key={idx}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: 'action.hover', borderRadius: 1, px: 1, py: 0.2
                }}
            >
                <Typography sx={{fontSize: '0.875rem'}}>{phone.phoneNumber}</Typography>
                <Tooltip title="Удалить номер">
                    <IconButton size="small" color="error" onClick={() => onDeletePhone(contactId, phone.phoneNumber)}>
                        <DeleteIcon sx={{fontSize: '0.9rem'}}/>
                    </IconButton>
                </Tooltip>
            </Box>
        ))}
    </Stack>
);

export default PhoneList;
