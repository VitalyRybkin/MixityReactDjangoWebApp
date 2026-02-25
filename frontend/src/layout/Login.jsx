import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import ThemeToggle from "../components/ThemeToggle";

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Login = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    theme.palette.mode === "dark"
                        ? "linear-gradient(-45deg, #0f2027, #203a43, #2c5364, #1e3c72)"
                        : "linear-gradient(-45deg, #e3f2fd, #bbdefb, #90caf9, #64b5f6)",
                backgroundSize: "400% 400%",
                animation: `${gradientAnimation} 15s ease infinite`,
            }}
        >
            {/* Theme toggle top right */}
            <Box sx={{ position: "fixed", top: 20, right: 20 }}>
                <ThemeToggle />
            </Box>

            <Container maxWidth="sm">
                <Paper
                    elevation={10}
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        backdropFilter: "blur(20px)",
                        backgroundColor: alpha(
                            theme.palette.background.paper,
                            0.7
                        ),
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}
                    >
                        Sign In
                    </Typography>

                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                        />

                        <Button
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 1,
                                py: 1.5,
                                borderRadius: 3,
                                fontWeight: 600,
                            }}
                        >
                            Login
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;