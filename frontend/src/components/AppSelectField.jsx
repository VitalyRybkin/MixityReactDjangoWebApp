import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'

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
    searchable = false,
    ...props
}) {
    if (searchable) {
        const selectedOption = options.find((option) => option[valueKey] === value) ?? null

        return (
            <Autocomplete
                options={options}
                value={selectedOption}
                getOptionLabel={(option) => option[labelKey] ?? ''}
                isOptionEqualToValue={(option, selected) => option[valueKey] === selected[valueKey]}
                onChange={(_, option) => onChange(option ? option[valueKey] : '')}
                renderInput={(params) => <TextField {...params} id={id} label={label} size="small" sx={{ mt: 2 }} />}
                {...props}
            />
        )
    }

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
