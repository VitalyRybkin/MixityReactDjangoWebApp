import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import ThemeToggle from "../components/ThemeToggle";

const TopBar = () => {
    return (
        <AppBar position="sticky" elevation={1}>
            <Toolbar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Mixity Logistics
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <ThemeToggle />
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;