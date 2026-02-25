import { Box, Typography, Button, Container } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const NotFound = () => {
    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <Typography
                    variant="h1"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: "5rem", md: "7rem" },
                        background: "linear-gradient(45deg, #1976d2, #42a5f5)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    404
                </Typography>

                <Typography variant="h4" gutterBottom>
                    Page Not Found
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    The page you’re looking for doesn’t exist or has been moved.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    component={RouterLink}
                    to="/"
                    sx={{ px: 4, py: 1.5, borderRadius: 3 }}
                >
                    Go Home
                </Button>
            </Box>
        </Container>
    );
};

export default NotFound;