import {AppBar, Toolbar, Box, Button} from "@mui/material";
import {useNavigate} from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants.js";
import SimpleNav from "../components/TopMenu.jsx";

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
        navigate("/login", {replace: true});
    };

    return (
        <AppBar position="sticky" elevation={1}>
            <Toolbar>
                {/*<Typography variant="h6" sx={sx.title}>*/}
                {/*    Заявки на доставку*/}
                {/*</Typography>*/}
                <SimpleNav>   </SimpleNav>

                <Box sx={{flexGrow: 1}}/>

                <ThemeToggle/>

                <Button
                    color="inherit"
                    onClick={handleLogout}
                    sx={sx.logout}
                >
                    Выйти
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;