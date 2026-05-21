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
        const parsed = parseFloat(raw.replace(/\s/g, '').replace(',', '.'))
        if (!isNaN(parsed)) onChange(parsed)
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
