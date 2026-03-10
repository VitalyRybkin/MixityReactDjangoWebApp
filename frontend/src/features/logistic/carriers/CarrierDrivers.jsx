import {Box} from "@mui/material";
import AppBreadcrumbs from "../../../components/AppBreadcrumbs.jsx";
import {useLocation} from "react-router-dom";
import React from "react";

export default function CarrierDriversPage() {
    const location = useLocation();
    const entity = location.state?.entity;

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />
        </Box>
    )
}