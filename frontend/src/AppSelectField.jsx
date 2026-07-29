import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'

export default function AppSelectField({
    id,
    label,
    value,
    onChange,
    options = [],
    valueKey = 'id',
    labelKey = 'name',
    includeAll = true,
    allLabel = 'Все',
    ...props
}) {
    const values = options.map((option) => option[valueKey])

    const safeValue = value === '' || value === null || value === undefined || values.includes(value) ? value : ''

    return (
        <FormControl fullWidth size="small" variant="outlined" sx={{ mt: 2 }}>
            <InputLabel id={`${id}-label`}>{label}</InputLabel>

            <Select
                labelId={`${id}-label`}
                id={id}
                value={safeValue}
                label={label}
                onChange={(e) => onChange(e.target.value)}
                {...props}
            >
                {includeAll && <MenuItem value="">{allLabel}</MenuItem>}

                {options.map((option) => (
                    <MenuItem key={option[valueKey]} value={option[valueKey]}>
                        {option[labelKey]}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}
