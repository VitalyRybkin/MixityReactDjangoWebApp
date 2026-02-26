import React from 'react';
import { Box, Typography, Divider, Grid } from "@mui/material";

const UniversalListView = ({ title, items, renderRow }) => {
    return (
        <Box sx={{ p: 3, width: '100%' }}>
            {/* Page header */}
            <Typography variant="h4" gutterBottom fontWeight={600}>
                {title}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Grid with a list */}
            <Grid
                container
                spacing={2}
                direction="column"
                sx={{ width: '100%', m: 0 }}
            >
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <Grid size={12} key={item.id || index}>
                            {renderRow(item)}
                        </Grid>
                    ))
                ) : (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                        Список пуст
                    </Typography>
                )}
            </Grid>
        </Box>
    );
};

export default UniversalListView;
