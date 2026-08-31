import { Box, Button, Divider, Tooltip, Typography } from '@mui/material'

import AppSelectField from '../../AppSelectField.jsx'
import DateRangeFields from '../../components/DateRangeFields.jsx'
import ApplyAction from '../../components/ui/buttons/ApplyAction.jsx'
import AppSidebar from '../../layouts/AppSidebar.jsx'

import { filterSidebarSx as sx } from './FilterSidebar.styles.js'

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

export default function FilterSidebar({
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
}) {
    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Typography variant="h6" sx={sx.title}>
                ФИЛЬТРЫ
            </Typography>

            <Divider sx={sx.sectionDivider} />

            <Typography variant="caption" color="text.secondary" sx={sx.dateLabel}>
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

            <Divider sx={sx.sectionDivider} />

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

            <Divider sx={sx.sectionDivider} />

            <Box sx={sx.presetGroup}>
                {quickPresetButtons.map((item) => (
                    <Tooltip key={item.value} title="День">
                        <Button
                            variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                            onClick={() => onPresetClick(item.value)}
                        >
                            {item.label}
                        </Button>
                    </Tooltip>
                ))}
            </Box>

            <Divider sx={sx.sectionDivider} />

            <Box sx={sx.presetGroup}>
                {rangePresetButtons.map((item) => (
                    <Tooltip key={item.value} title={item.label === 'Месяц' ? 'Месяц' : 'Неделя'}>
                        <Button
                            variant={selectedPreset === item.value ? 'contained' : 'outlined'}
                            onClick={() => onPresetClick(item.value)}
                        >
                            {item.label}
                        </Button>
                    </Tooltip>
                ))}
            </Box>

            <Divider sx={sx.footerDivider} />

            <Box sx={sx.applyContainer}>
                <ApplyAction onClick={onApply} sx={sx.applyButton} />
            </Box>
        </AppSidebar>
    )
}
