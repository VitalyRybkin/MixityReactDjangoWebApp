import { useState } from 'react'

import dayjs from 'dayjs'

const normalizeStoredValue = (value, defaultValue) => {
    if (typeof defaultValue === 'boolean') {
        return value === true || value === 'true'
    }

    return value
}

const loadFiltersFromStorage = (storageKey, defaults) => {
    if (!storageKey) {
        return { ...defaults }
    }

    try {
        const saved = localStorage.getItem(storageKey)

        if (!saved) {
            return { ...defaults }
        }

        const parsed = JSON.parse(saved)

        return Object.keys(defaults).reduce((result, field) => {
            const storedValue = parsed[field]

            result[field] =
                storedValue !== undefined ? normalizeStoredValue(storedValue, defaults[field]) : defaults[field]

            return result
        }, {})
    } catch (error) {
        console.error('Failed to load filters:', error)
        return { ...defaults }
    }
}

const saveFiltersToStorage = (storageKey, filters) => {
    if (!storageKey) {
        return
    }

    try {
        localStorage.setItem(storageKey, JSON.stringify(filters))
    } catch (error) {
        console.error('Failed to save filters:', error)
    }
}

export function useFilters(initialDefaults, storageKey = null) {
    const [filters, setFilters] = useState(() => loadFiltersFromStorage(storageKey, initialDefaults))

    const [draftFilters, setDraftFilters] = useState(() => loadFiltersFromStorage(storageKey, initialDefaults))

    const applyFilters = () => {
        const nextFilters = { ...draftFilters }

        setFilters(nextFilters)
        saveFiltersToStorage(storageKey, nextFilters)
    }

    const handleDraftFilterChange = (field, value) => {
        const isDateField = field === 'dateFrom' || field === 'dateTo'

        setDraftFilters((prev) => ({
            ...prev,
            [field]: isDateField && value ? dayjs(value).format('YYYY-MM-DD') : value,
            ...(isDateField ? { selectedPreset: null } : {}),
        }))
    }

    const resetFilters = () => {
        const nextFilters = { ...initialDefaults }

        setFilters(nextFilters)
        setDraftFilters(nextFilters)

        if (storageKey) {
            localStorage.removeItem(storageKey)
        }
    }

    return {
        filters,
        draftFilters,
        setDraftFilters,
        applyFilters,
        resetFilters,
        handleDraftFilterChange,
    }
}
