import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import ClearIcon from '@mui/icons-material/Clear'
import {
    Box,
    CircularProgress,
    Divider,
    IconButton,
    InputAdornment,
    Table,
    TableBody,
    TableContainer,
    TextField,
    Typography,
} from '@mui/material'

import { entityTableListSx as listSx } from '../styles/entityTableList.styles.js'

import AppBreadcrumbs from './AppBreadcrumbs.jsx'
import { objectListViewSx as sx } from './ObjectListView.styles.js'
import PageHeader from './PageHeader.jsx'
import ErrorState from './ui/ErrorState.jsx'
import AddAction from './ui/buttons/AddAction.jsx'

const ObjectListView = ({
    title,
    items = [],
    renderRow,
    loading = false,
    addTo,
    error = null,
    onRetry,
    emptyText = 'Список пуст',

    searchable = false,
    searchPlaceholder = 'Поиск',
    getSearchText = (item) => item?.name ?? '',
}) => {
    const navigate = useNavigate()
    const location = useLocation()

    const [search, setSearch] = useState('')

    const filteredItems = useMemo(() => {
        const value = search.trim().toLowerCase()

        if (!searchable || !value) {
            return items
        }

        return items.filter((item) =>
            String(getSearchText(item) ?? '')
                .toLowerCase()
                .includes(value),
        )
    }, [items, search, searchable, getSearchText])

    return (
        <Box sx={listSx.page}>
            <AppBreadcrumbs />

            <PageHeader
                title={title}
                actions={
                    addTo ? (
                        <AddAction
                            onClick={() =>
                                navigate(addTo, {
                                    state: { from: location.pathname },
                                })
                            }
                        />
                    ) : null
                }
            />

            <Divider sx={listSx.divider} />

            {searchable && (
                <Box sx={sx.searchWrapper}>
                    <TextField
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={searchPlaceholder}
                        size="small"
                        fullWidth
                        slotProps={{
                            input: {
                                endAdornment: search ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            edge="end"
                                            aria-label="Очистить поиск"
                                            onClick={() => setSearch('')}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                </Box>
            )}

            {error ? (
                <ErrorState error={error} onRetry={onRetry} loading={loading} />
            ) : loading ? (
                <Box sx={listSx.loading}>
                    <CircularProgress />
                </Box>
            ) : filteredItems.length > 0 ? (
                <TableContainer>
                    <Table size="small" sx={listSx.table}>
                        <TableBody>
                            {filteredItems.map((item, index) => (
                                <React.Fragment key={item?.id ?? index}>{renderRow(item)}</React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography color="text.secondary" sx={sx.empty}>
                    {search ? 'Ничего не найдено' : emptyText}
                </Typography>
            )}
        </Box>
    )
}

export default ObjectListView
