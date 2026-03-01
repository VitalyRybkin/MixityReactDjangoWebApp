import { Stack, Chip, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function PhoneList({
                                      contactId,
                                      phoneNumbers,
                                      onDeletePhone,
                                      isDeletingContact,
                                      isDeletingPhone,
                                  }) {
    const deletingContact =
        typeof isDeletingContact === "function" ? isDeletingContact(contactId) : !!isDeletingContact;

    return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(phoneNumbers ?? []).map((phone) => {
                const number = phone.phoneNumber;

                const deletingThisPhone =
                    typeof isDeletingPhone === "function" ? isDeletingPhone(contactId, number) : false;

                const disabled = deletingContact || deletingThisPhone;

                return (
                    <Chip
                        key={number}
                        label={number}
                        variant="outlined"
                        size="small"
                        onDelete={disabled ? undefined : () => onDeletePhone?.(contactId, number)}
                        deleteIcon={
                            <Tooltip title="Удалить телефон">
                                <DeleteIcon fontSize="small" color="error" />
                            </Tooltip>
                        }
                        sx={{
                            mb: 0.5,
                            alignItems: "center",
                            "& .MuiChip-label": { display: "flex", alignItems: "center" },
                            "& .MuiChip-deleteIcon": { display: "flex", alignItems: "center", color: "error.main","&:hover": {
                                    color: "error.dark",
                                }, },
                            padding: "1rem 0.5rem",
                            borderRadius: "0.5rem",
                        }}
                    />
                );
            })}
        </Stack>
    );
}