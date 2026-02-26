import { useEffect, useState } from "react";
import api from "../api";
import { Grid, Box, Typography, Divider } from "@mui/material";
import ListInfoCard from "../components/ListInfoCard.jsx";

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        api.get("/api/stock/").then((res) => {
            const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
            setWarehouses(data);
        });
    }, []);

    return (
        <Box sx={{ p: 3, width: '100%' }}>
            <Typography variant="h4" gutterBottom>Склады</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid
                container
                spacing={2}
                direction="column"
                sx={{ width: '100%', m: 0 }}
            >
                {warehouses.map((w) => (
                    <Grid item xs={12} key={w.id}>
                        <ListInfoCard
                            title={w.name}
                            subtitle={w.organization}
                            extra={w.address}
                            email={w.email}
                            fileUrl={w.directions}
                            to={`/warehouse/${w.id}`}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
