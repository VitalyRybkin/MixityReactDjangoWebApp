import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'

export default function RepairAfterReturnField({ location, isAfterReturn, onChange, requestId }) {
    if (location !== 'workshop') return null

    return (
        <Box sx={{ mt: 0.5 }}>
            <FormControlLabel
                sx={{ alignItems: 'flex-start', ml: 0, mr: 0 }}
                control={
                    <Checkbox
                        size="small"
                        sx={{ p: 0.5, mr: 0.75 }}
                        checked={Boolean(isAfterReturn)}
                        onChange={(event) => onChange(event.target.checked)}
                    />
                }
                label={
                    <Typography variant="body2" sx={{ pt: 0.5, lineHeight: 1.4 }}>
                        Ремонт после возврата из аренды
                    </Typography>
                }
            />
            {Boolean(isAfterReturn) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.4 }}>
                    Подписанный акт приёма-передачи прикрепите в «Файлы открытия»
                    {requestId ? '.' : ' после сохранения заявки.'}
                </Typography>
            )}
        </Box>
    )
}
