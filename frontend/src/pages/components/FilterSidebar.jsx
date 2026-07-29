import { Box, Button, Divider, Tooltip, Typography } from '@mui/material'

import AppSelectField from '../../AppSelectField.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
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
        handleDraftFilterChange,
        onApply,
        onPresetClick,
        selectedPreset,
        customers = [],
        warehouses = [],
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

            <DateRangeFields
                filters={draftFilters}
                onChange={handleDraftFilterChange}
                fromField="dateFrom"
                toField="dateTo"
                fromId="orders-date-from"
                toId="orders-date-to"
            />

            <Divider sx={{ my: 2, mb: 0 }} />

            <AppSelectField
                id="orders-status"
                label="Статус"
                value={draftFilters.status}
                options={statusOptions}
                valueKey="value"
                labelKey="label"
                onChange={(value) => handleDraftFilterChange('status', value)}
            />

            <AppSelectField
                id="orders-customer"
                label="Контрагент"
                value={draftFilters.customerId}
                options={customers}
                onChange={(value) => handleDraftFilterChange('customerId', value)}
            />

            <AppSelectField
                id="orders-warehouse"
                label="Склад"
                value={draftFilters.warehouseId}
                options={warehouses}
                onChange={(value) => handleDraftFilterChange('warehouseId', value)}
            />

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

            <ApplyAction onClick={onApply} sx={{ width: '100%' }} />
        </AppSidebar>
    )
}
