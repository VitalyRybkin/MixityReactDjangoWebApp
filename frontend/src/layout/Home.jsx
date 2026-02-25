import { Box, Paper, Typography } from "@mui/material";

const sx = {
    wrapper: { display: "flex", justifyContent: "center" },
    card: {
        p: { xs: 4, md: 6 },
        borderRadius: 4,
        maxWidth: 700,
        width: "100%",
    },
    title: { fontWeight: 700, mb: 2 },
};

const Home = () => {
    return (
        <Box sx={sx.wrapper}>
            <Paper elevation={3} sx={sx.card}>
                <Typography variant="h4" sx={sx.title}>
                    Welcome to the Home Page
                </Typography>
                <Typography color="text.secondary">
                    This is the home page of our application.
                </Typography>
            </Paper>
        </Box>
    );
};

export default Home;