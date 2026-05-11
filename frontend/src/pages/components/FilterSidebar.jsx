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

import AppSidebar from '../../layouts/AppSidebar.jsx'

const quickPresetButtons = [
    { value: 'yesterday', label: 'Вчера' },
    { value: 'today', label: 'Сегодня' },
    { value: 'tomorrow', label: 'Завтра' },
]

const rangePresetButtons = [
    { value: 'lastWeek', label: 'Прошлая' },
    { value: 'currentWeek', label: 'Текущая' },
    { value: 'nextWeek', label: 'Следующая' },
    { value: 'thisMonth', label: 'Месяц' },
]

const dateFieldProps = {
    fullWidth: true,
    size: 'small',
    margin: 'normal',
    slotProps: {
        inputLabel: { shrink: true },
    },
}

export default function FilterSidebar(props) {
    const {
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
    } = props

    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Typography variant="h6" sx={{ mt: 3 }}>
                ФИЛЬТРЫ
            </Typography>

            <Divider sx={{ my: 2, mb: 0 }} />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Дата доставки:
            </Typography>

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
                    variant="outlined"
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
                    variant="outlined"
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
                    <Tooltip key={item.value} title={'День'}>
                        <Button
                            key={item.value}
                            variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                            onClick={() => onPresetClick(item.value)}
                        >
                            {item.label}
                        </Button>
                    </Tooltip>
                ))}
            </Box>

            <Divider sx={{ my: 2, mb: 0 }} />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                {rangePresetButtons.map((item) => (
                    <Tooltip key={item.label} title={item.label === 'Месяц' ? 'Месяц' : 'Неделя'}>
                        <Button
                            key={item.value}
                            variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                            onClick={() => onPresetClick(item.value)}
                        >
                            {item.label}
                        </Button>
                    </Tooltip>
                ))}
            </Box>

            <Divider sx={{ my: 2, mb: 1 }} />

            <Button variant="contained" fullWidth sx={{ mt: 1 }} onClick={onApply}>
                Применить
            </Button>
        </AppSidebar>
    )
}
