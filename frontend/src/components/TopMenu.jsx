import { Stack, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

const SimpleNav = () => {
    return (
        <Stack direction="row" spacing={2} sx={{ ml: 3 }}>
            <Button
                component={NavLink}
                to="/"
                color="inherit"
                sx={{
                    "&.active": {
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        borderBottom: "2px solid white",
                        borderRadius: 0
                    }
                }}
            >
                Заявки
            </Button>

            <Button
                component={NavLink}
                to="/carriers"
                color="inherit"
                sx={{
                    "&.active": {
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        borderBottom: "2px solid white",
                        borderRadius: 0
                    }
                }}
            >
                Перевозчики
            </Button>

            <Button
                component={NavLink}
                to="/warehouses"
                color="inherit"
                sx={{
                    "&.active": {
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        borderBottom: "2px solid white",
                        borderRadius: 0
                    }
                }}
            >
                Склады
            </Button>
        </Stack>
    );
};

export default SimpleNav;
