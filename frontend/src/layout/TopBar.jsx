import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../contstants.js";

const sx = {
    title: {
        fontWeight: 600,
    },
    logout: {
        ml: 2,
        textTransform: "none",
        fontWeight: 500,
    },
};

const TopBar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        navigate("/login", { replace: true });
    };

    return (
        <AppBar position="sticky" elevation={1}>
            <Toolbar>
                <Typography variant="h6" sx={sx.title}>
                    Mixity Logistics
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <ThemeToggle />

                <Button
                    color="inherit"
                    onClick={handleLogout}
                    sx={sx.logout}
                >
                    Logout
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;