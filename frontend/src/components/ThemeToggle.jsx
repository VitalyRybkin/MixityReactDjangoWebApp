import { IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "../theme/colorModeContext";

const ThemeToggle = () => {
    const { mode, toggleColorMode } = useColorMode();

    return (
        <Tooltip title={mode === "dark" ? "Светлая" : "Тёмная"}>
            <IconButton onClick={toggleColorMode} color="inherit">
                {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
        </Tooltip>
    );
};

export default ThemeToggle;