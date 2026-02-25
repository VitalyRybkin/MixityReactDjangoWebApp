import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

const sx = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    card: (theme) => ({
        p: { xs: 4, md: 6 },
        textAlign: "center",
        borderRadius: 4,
        backgroundColor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === "dark" ? 0.7 : 0.85
        ),
        backdropFilter: "blur(12px)",
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        boxShadow: theme.shadows[10],
    }),

    code: (theme) => ({
        fontWeight: 800,
        fontSize: { xs: "4.5rem", md: "6rem" },
        letterSpacing: -2,
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    }),

    description: {
        mt: 2,
        mb: 4,
    },

    button: {
        px: 4,
        py: 1.5,
        borderRadius: 3,
        fontWeight: 600,
        textTransform: "none",
    },
};

const NotFound = () => {
    return (
        <Box sx={sx.page}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={sx.card}>
                    <Typography variant="h1" sx={sx.code}>
                        404
                    </Typography>

                    <Typography variant="h4">
                        Page Not Found
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={sx.description}
                    >
                        The page you’re looking for doesn’t exist or has been moved.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        component={RouterLink}
                        to="/"
                        sx={sx.button}
                    >
                        Go Home
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default NotFound;