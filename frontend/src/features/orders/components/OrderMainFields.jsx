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

import FileUploadAction from '../../../components/FileUploadAction.jsx'
import { fieldsetStyles, orderStatus } from '../utils/order.form.constants.js'

import { orderMainFieldsSx as sx } from './OrderMainFields.styles.js'

export default function OrderMainFields({
    form,
    setForm,
    onChange,
    orderResources,
    isEdit,
    order,
    onDownloadUpd,
    onViewUpd,
}) {
    return (
        <Box component="fieldset" sx={[fieldsetStyles, sx.fieldset]}>
            <Typography component="legend" variant="caption" sx={sx.legend}>
                Данные заказа:
            </Typography>

            <Stack spacing={2} sx={sx.fields}>
                <Box sx={sx.fieldRow}>
                    <TextField
                        label="Дата доставки"
                        type="date"
                        size="small"
                        value={form.delivery_date || ''}
                        onChange={onChange('delivery_date')}
                        slotProps={{ inputLabel: { shrink: true } }}
                        sx={sx.field}
                    />

                    <FormControl variant="outlined" size="small" sx={sx.field}>
                        <InputLabel id="status-label">Статус</InputLabel>

                        <Select
                            labelId="status-label"
                            label="Статус"
                            value={form.status || ''}
                            onChange={onChange('status')}
                            variant="outlined"
                        >
                            {Object.entries(orderStatus).map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={sx.fieldRow}>
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
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                sx: sx.field,
                            },
                        }}
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
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                sx: sx.field,
                            },
                        }}
                    />
                </Box>

                <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="client-label">Клиент</InputLabel>

                    <Select
                        labelId="client-label"
                        label="Клиент"
                        value={form.client || ''}
                        onChange={onChange('client')}
                        variant="outlined"
                    >
                        <MenuItem value="">Не выбран</MenuItem>

                        {orderResources.clients.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Box sx={sx.actions}>
                    {isEdit && (
                        <FileUploadAction
                            entityId={order.id}
                            fileUrl={order.upd_pdf}
                            onUpload={onDownloadUpd}
                            onView={onViewUpd}
                            uploadTitle="Загрузить УПД"
                            viewTitle="Просмотр УПД"
                        />
                    )}

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
                                sx: sx.checkboxLabel,
                            },
                        }}
                    />
                </Box>
            </Stack>
        </Box>
    )
}
