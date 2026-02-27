import {Typography} from "@mui/material";
import React from "react";

const EmailLink = ({email, sx}) => (
    <Typography
        variant="body2"
        onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.location.href = `mailto:${email}`;
        }}
        sx={{
            fontWeight: 500,
            cursor: 'pointer',
            color: '#217dc9',
            '&:hover': {textDecoration: 'underline'},
            ...sx
        }}
    >
        {email}
    </Typography>
);

export default EmailLink;