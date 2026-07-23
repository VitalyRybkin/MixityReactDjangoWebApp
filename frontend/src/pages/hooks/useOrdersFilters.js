import { useState } from 'react'

import dayjs from 'dayjs'

import { getPresetRange } from '../utils/orders.date-filters.js'

const saveFiltersToStorage = (storageKey, filters) => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(filters))
    } catch (error) {
        console.error('Failed to save order filters:', error)
    }
}

const loadFiltersFromStorage = (storageKey, defaults) => {
    try {
        const saved = localStorage.getItem(storageKey)

        if (!saved) {
            return defaults
        }

        const parsed = JSON.parse(saved)

        return {
            ...defaults,
            ...parsed,
            dateFrom: parsed.dateFrom || defaults.dateFrom,
            dateTo: parsed.dateTo || defaults.dateTo,
        }
    } catch (error) {
        console.error('Failed to load order filters:', error)
        return defaults
    }
}

export function useOrdersFilters(storageKey, initialDefaults) {
    const [filters, setFilters] = useState(() => loadFiltersFromStorage(storageKey, initialDefaults))

    const [draftFilters, setDraftFilters] = useState(() => loadFiltersFromStorage(storageKey, initialDefaults))

    const selectedPreset = draftFilters.selectedPreset ?? null

    const formattedFilters = {
        ...filters,
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
    }

    const applyFilters = () => {
        const nextFilters = { ...draftFilters }

        setFilters(nextFilters)
        saveFiltersToStorage(storageKey, nextFilters)
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

    const handleDraftFilterChange = (field, value) => {
        const isDateField = field === 'dateFrom' || field === 'dateTo'

        setDraftFilters((prev) => ({
            ...prev,
            [field]: isDateField && value ? dayjs(value).format('YYYY-MM-DD') : value,
            ...(isDateField ? { selectedPreset: null } : {}),
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
