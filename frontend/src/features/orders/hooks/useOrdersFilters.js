import { useFilters } from '../../../hooks/useFilters.js'
import { getPresetRange } from '../../../pages/utils/orders.date-filters.js'

export function useOrdersFilters(storageKey, initialDefaults) {
    const { filters, draftFilters, setDraftFilters, applyFilters, handleDraftFilterChange } = useFilters(
        initialDefaults,
        storageKey,
    )

    const selectedPreset = draftFilters.selectedPreset ?? null

    const formattedFilters = {
        ...filters,
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
    }

    const handlePresetClick = (preset) => {
        const range = getPresetRange(preset)

        setDraftFilters((prev) => ({
            ...prev,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
            selectedPreset: preset,
        }))
    }

    return {
        filters,
        formattedFilters,
        draftFilters,
        setDraftFilters,
        selectedPreset,
        applyFilters,
        handlePresetClick,
        handleDraftFilterChange,
    }
}
