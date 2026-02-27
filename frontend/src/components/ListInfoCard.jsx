import React from 'react';
import {Card, CardActionArea, CardContent, Typography, Divider, Box, Tooltip, IconButton} from "@mui/material";
import {Link as RouterLink} from "react-router-dom";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EmailLink from "./EmailLink.jsx";

const ListInfoCard = ({title, subtitle, extra, email, fileUrl, to}) => {
    const hasTextBefore = Boolean(subtitle || extra || email);

    return (
        <Card sx={{width: '100%', mb: 0}}>
            <CardActionArea component={RouterLink} to={to}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>{title || "Без названия"}</Typography>
                    <Divider sx={{my: 1.5}}/>

                    <Box sx={{display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.875rem'}}>

                        {subtitle && <Box component="span">{subtitle}</Box>}

                        {extra && (
                            <>
                                {subtitle && <Divider orientation="vertical" flexItem
                                                      sx={{mx: 2, height: 14, alignSelf: 'center'}}/>}
                                <Box component="span">{extra}</Box>
                            </>
                        )}

                        {email && (
                            <>
                                {(subtitle || extra) && <Divider orientation="vertical" flexItem
                                                                 sx={{mx: 2, height: 14, alignSelf: 'center'}}/>}
                                <EmailLink
                                    email={email}
                                />
                            </>
                        )}

                        {/* PDF */}
                        {fileUrl && (
                            <>
                                {hasTextBefore && (
                                    <Divider orientation="vertical" flexItem
                                             sx={{mx: 2, height: 14, alignSelf: 'center'}}/>
                                )}

                                <Tooltip title="Открыть инструкцию (PDF)">
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            window.open(fileUrl, '_blank');
                                        }}
                                        sx={{
                                            p: 0,
                                            color: '#d32f2f',
                                            '&:hover': {
                                                color: '#b71c1c',
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                    >
                                        <PictureAsPdfIcon sx={{fontSize: 20}}/>
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};


export default ListInfoCard;
