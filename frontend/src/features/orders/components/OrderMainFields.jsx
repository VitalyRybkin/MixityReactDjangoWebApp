import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers'

import DownAction from '../../../components/ui/buttons/DownAction.jsx'
import ViewAction from '../../../components/ui/buttons/ViewAction.jsx'
import { fieldsetStyles, orderStatus } from '../order.form.constants.js'

export default function OrderMainFields({ form, setForm, onChange, orderResources, isEdit, order, onDownloadUpd }) {
    return (
        <Box component="fieldset" sx={fieldsetStyles}>
            <Typography
                component="legend"
                variant="caption"
                sx={{ px: 1, color: 'text.secondary', fontWeight: 'medium' }}
            >
                Данные заказа:
            </Typography>

            <Stack spacing={2} sx={{ flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        label="Дата доставки"
                        type="date"
                        size="small"
                        value={form.delivery_date || ''}
                        onChange={onChange('delivery_date')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={{ flex: 1 }}
                    />

                    <FormControl variant="outlined" size="small" sx={{ flex: 1 }}>
                        <InputLabel id="status-label">Статус</InputLabel>

                        <Select
                            labelId="status-label"
                            label="Статус"
                            value={form.status || ''}
                            onChange={onChange('status')}
                        >
                            {Object.entries(orderStatus).map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    <TimePicker
                        label="Время доставки c:"
                        ampm={false}
                        format="HH:mm"
                        value={form.delivery_from || null}
                        onChange={(newValue) =>
                            setForm((prev) => ({
                                ...prev,
                                delivery_from: newValue,
                            }))
                        }
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />

                    <TimePicker
                        label="до:"
                        ampm={false}
                        format="HH:mm"
                        value={form.delivery_to || null}
                        onChange={(newValue) =>
                            setForm((prev) => ({
                                ...prev,
                                delivery_to: newValue,
                            }))
                        }
                        slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                </Stack>

                <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="client-label">Клиент</InputLabel>

                    <Select
                        labelId="client-label"
                        label="Клиент"
                        value={form.client || ''}
                        onChange={onChange('client')}
                    >
                        <MenuItem value="">Не выбран</MenuItem>

                        {orderResources.clients.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'start',
                        gap: 2,
                        mt: 2,
                        mb: 1,
                        alignItems: 'center',
                    }}
                >
                    {isEdit &&
                        (order?.udp_pdf ? (
                            <ViewAction title="Просмотр УПД" onClick={() => window.open(order.udp_pdf, '_blank')} />
                        ) : (
                            <DownAction title="Загрузить УПД" onClick={() => onDownloadUpd(order.id)} />
                        ))}

                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={form.samples}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        samples: e.target.checked,
                                    }))
                                }
                            />
                        }
                        label="Образцы"
                        slotProps={{
                            typography: {
                                sx: { fontSize: '0.9rem', color: 'text.secondary' },
                            },
                        }}
                    />
                </Box>
            </Stack>
        </Box>
    )
}
