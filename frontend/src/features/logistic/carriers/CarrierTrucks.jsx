import {Box} from "@mui/material";
import AppBreadcrumbs from "../../../components/AppBreadcrumbs.jsx";
import React from "react";
import {useLocation} from "react-router-dom";

export default function CarrierTrucksPage() {

    const location = useLocation();
    const entity = location.state?.entity;

    return (
        <Box sx={{ p: 3 }}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />
        </Box>
    )
}