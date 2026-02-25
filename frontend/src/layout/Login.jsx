import {useState} from "react";
import {Box, Button, TextField, Typography, Paper, Container, Alert} from "@mui/material";
import {useNavigate} from "react-router-dom";
import api from "../api";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "../constants.js";
import ThemeToggle from "../components/ThemeToggle";

const sx = {
    page: {minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center"},
    toggle: {position: "fixed", top: 20, right: 20, zIndex: 10},
    card: {p: {xs: 4, md: 6}, textAlign: "center", borderRadius: 4},
    form: {display: "flex", flexDirection: "column", gap: 3, mt: 3},
    submit: {py: 1.4, borderRadius: 3, fontWeight: 600, textTransform: "none"},
};

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await api.post("/api/auth/token/", {username, password});

            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

            navigate("/", {replace: true});
        } catch (err) {
            if (!err.response) setError("Network error. Check API URL / connection.");
            else if (err.response.status === 401) setError("Invalid username or password.");
            else setError("Login failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={sx.page}>
            <Box sx={sx.toggle}>
                <ThemeToggle/>
            </Box>

            <Container maxWidth="sm">
                <Paper elevation={10} sx={sx.card}>
                    <Typography variant="h4" sx={{fontWeight: 700}}>
                        Вход
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{mt: 3}}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" sx={sx.form} onSubmit={onSubmit}>
                        <TextField
                            label="Логин"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            fullWidth
                            required
                        />

                        <TextField
                            label="Пароль"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            fullWidth
                            required
                        />

                        <Button type="submit" variant="contained" size="large" sx={sx.submit} disabled={loading}>
                            {loading ? "Signing in..." : "Войти"}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;