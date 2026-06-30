import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { formatDate, getPresetRange } from '../utils/orders.date-filters.js'

const STORAGE_KEY = 'orders_filters_cache'

const saveFiltersToStorage = (filters) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
}

const loadFiltersFromStorage = (defaults) => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaults

    try {
        const parsed = JSON.parse(saved)
        return {
            ...defaults,
            ...parsed,
            dateFrom: parsed.dateFrom || defaults.dateFrom,
            dateTo: parsed.dateTo || defaults.dateTo,
        }
    } catch (e) {
        console.error('Error parsing filters', e)
        return defaults
    }
}

export function useOrdersFilters() {
    const today = formatDate(new Date())

    const initialDefaults = {
        dateFrom: today,
        dateTo: today,
        status: '',
        customerId: '',
        warehouseId: '',
        selectedPreset: 'today',
    }

    const savedData = useMemo(() => loadFiltersFromStorage(initialDefaults), [])

    const [selectedPreset, setSelectedPreset] = useState(savedData.selectedPreset)
    const [filters, setFilters] = useState(savedData)
    const [draftFilters, setDraftFilters] = useState(savedData)

    const formattedFilters = {
        ...filters,
        dateFrom: filters.dateFrom || '',
        dateTo: filters.dateTo || '',
    }

    const applyFilters = () => {
        setFilters(draftFilters)
        saveFiltersToStorage(draftFilters)
    }

    const handlePresetClick = (preset) => {
        const range = getPresetRange(preset)
        setSelectedPreset(preset)
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

        if (isDateField) setSelectedPreset(null)
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