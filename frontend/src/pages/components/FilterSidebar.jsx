import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'

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

export default function FilterSidebar({
    open,
    setOpen,
    draftFilters,
    setDraftFilters,
    onApply,
    onPresetClick,
    selectedPreset,
    onDraftFilterChange,
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
                        id="orders-date-from"
                        name="dateFrom"
                        label="C:"
                        type="date"
                        value={draftFilters.dateFrom}
                        onChange={(e) => onDraftFilterChange('dateFrom', e.target.value)}
                        {...dateFieldProps}
                    />

                    <TextField
                        id="orders-date-to"
                        name="dateTo"
                        label="По:"
                        type="date"
                        value={draftFilters.dateTo}
                        onChange={(e) => onDraftFilterChange('dateTo', e.target.value)}
                        {...dateFieldProps}
                    />

                    <FormControl fullWidth size="small" margin="normal">
                        <InputLabel id="orders-status-label">Статус</InputLabel>
                        <Select
                            labelId="orders-status-label"
                            id="orders-status"
                            value={draftFilters.status}
                            label="Статус"
                            onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                        >
                            <MenuItem value="">Все</MenuItem>
                            {statusOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" margin="normal">
                        <InputLabel id="orders-customer-label">Контрагент</InputLabel>
                        <Select
                            labelId="orders-customer-label"
                            id="orders-customer"
                            value={draftFilters.customerId}
                            label="Контрагент"
                            onChange={(e) => setDraftFilters((prev) => ({ ...prev, customerId: e.target.value }))}
                        >
                            <MenuItem value="">Все</MenuItem>
                            {customers.map((customer) => (
                                <MenuItem key={customer.id} value={customer.id}>
                                    {customer.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider sx={{ my: 2, mb: 0 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {quickPresetButtons.map((item) => (
                            <Button
                                key={item.value}
                                variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                                onClick={() => onPresetClick(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2, mb: 0 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        {rangePresetButtons.map((item) => (
                            <Button
                                key={item.value}
                                variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                                onClick={() => onPresetClick(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2, mb: 1 }} />

                    <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={onApply}>
                        Применить
                    </Button>
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
