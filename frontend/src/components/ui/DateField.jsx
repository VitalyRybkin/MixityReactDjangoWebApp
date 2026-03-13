import { TextField } from '@mui/material'

function formatDateInput(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8)

    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

export default function DateField({ label, value, onChange, required = false, fullWidth = true }) {
    const handleChange = (e) => {
        const formatted = formatDateInput(e.target.value)
        onChange(formatted)
    }

    return (
        <TextField
            label={label}
            placeholder="дд.мм.гггг"
            value={value}
            onChange={handleChange}
            required={required}
            fullWidth={fullWidth}
            inputMode="numeric"
        />
    )
}
