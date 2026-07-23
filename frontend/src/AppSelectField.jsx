import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'

export default function AppSelectField({
    id,
    label,
    value,
    onChange,
    options,
    valueKey = 'id',
    labelKey = 'name',
    includeAll = true,
    allLabel = 'Все',
    ...props
}) {
    return (
        <FormControl fullWidth size="small" margin="normal" variant="outlined">
            <InputLabel id={`${id}-label`}>{label}</InputLabel>

            <Select
                labelId={`${id}-label`}
                id={id}
                value={value}
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
