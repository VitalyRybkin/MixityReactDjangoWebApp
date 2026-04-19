import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Divider, MenuItem, TextField, Tooltip, Typography } from '@mui/material'

const SIDEBAR_WIDTH = 300
const TOPBAR_HEIGHT = 64
const COLLAPSED_WIDTH = 48

export const ordersSidebarSx = {
    sidebar: (open) => ({
        position: 'fixed',
        top: `${TOPBAR_HEIGHT}px`,
        left: 0,
        width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        p: open ? 2 : 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
    }),
    collapsedButtonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        pt: 2,
    },
    collapsedButton: {
        minWidth: 0,
        width: 24,
        height: 40,
        p: 0,
        borderRadius: 1,
    },
}

const quickPresetButtons = [
    { value: 'yesterday', label: 'Вчера' },
    { value: 'today', label: 'Сегодня' },
    { value: 'tomorrow', label: 'Завтра' },
]

const rangePresetButtons = [
    { value: 'lastWeek', label: 'Прошлая неделя' },
    { value: 'currentWeek', label: 'Эта неделя' },
    { value: 'thisMonth', label: 'Этот месяц' },
]

const dateFieldProps = {
    fullWidth: true,
    size: 'small',
    margin: 'normal',
    slotProps: {
        inputLabel: { shrink: true },
    },
}

export default function OrdersFiltersSidebar({
    open,
    setOpen,
    draftFilters,
    setDraftFilters,
    preset,
    setPreset,
    onApply,
    customers = [],
    statusOptions = [],
}) {
    return (
        <Box sx={ordersSidebarSx.sidebar(open)}>
            {open ? (
                <>
                    <Tooltip title="Закрыть" placement="bottom" arrow>
                        <Button variant="outlined" onClick={() => setOpen(false)} fullWidth>
                            <ChevronLeftIcon />
                        </Button>
                    </Tooltip>

                    <Typography variant="h6" sx={{ mt: 3 }}>
                        Фильтры
                    </Typography>

                    <Divider sx={{ my: 2, mb: 0 }} />

                    <TextField
                        label="C:"
                        type="date"
                        value={draftFilters.dateFrom}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                        {...dateFieldProps}
                    />

                    <TextField
                        label="По:"
                        type="date"
                        value={draftFilters.dateTo}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                        {...dateFieldProps}
                    />

                    <TextField
                        label="Статус"
                        select
                        value={draftFilters.status}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                        fullWidth
                        size="small"
                        margin="normal"
                    >
                        <MenuItem value="">Все</MenuItem>
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Контрагент"
                        select
                        value={draftFilters.customerId}
                        onChange={(e) => setDraftFilters((prev) => ({ ...prev, customerId: e.target.value }))}
                        fullWidth
                        size="small"
                        margin="normal"
                    >
                        <MenuItem value="">Все</MenuItem>
                        {customers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={onApply}>
                        Применить
                    </Button>

                    <Divider sx={{ my: 2, mb: 0 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {quickPresetButtons.map((item) => (
                            <Button
                                key={item.value}
                                variant={preset === item.value ? 'contained' : 'outlined'}
                                onClick={() => setPreset(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2, mb: 0 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, mb: 2 }}>
                        {rangePresetButtons.map((item) => (
                            <Button
                                key={item.value}
                                variant={preset === item.value ? 'contained' : 'outlined'}
                                onClick={() => setPreset(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>
                </>
            ) : (
                <Box sx={ordersSidebarSx.collapsedButtonWrapper}>
                    <Tooltip title="Открыть" placement="right" arrow>
                        <Button variant="outlined" onClick={() => setOpen(true)} sx={ordersSidebarSx.collapsedButton}>
                            <ChevronRightIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                </Box>
            )}
        </Box>
    )
}
