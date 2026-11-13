import { useEffect, useRef, useState } from 'react'

const formatRu = (value) =>
    Number(value ?? 0).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

export function useCurrencyField(value, onChange) {
    const [display, setDisplay] = useState(() => formatRu(value))
    const isFocused = useRef(false)

    useEffect(() => {
        if (!isFocused.current) {
            setDisplay(formatRu(value))
        }
    }, [value])

    const handleChange = (e) => {
        const raw = e.target.value
        setDisplay(raw)
        const normalized = raw.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
        if (normalized === '') {
            onChange(null)
            return
        }
        // Keep the stored value at the same two-decimal precision as the UI.
        if (!/^-?\d+(?:\.\d*)?$/.test(normalized)) return
        const parsed = Number(normalized)
        if (Number.isFinite(parsed)) onChange(Math.round((parsed + Number.EPSILON) * 100) / 100)
    }

    const handleBlur = () => {
        isFocused.current = false
        setDisplay(formatRu(value))
    }

    const handleFocus = () => {
        isFocused.current = true
    }

    return { display, handleChange, handleBlur, handleFocus }
}
