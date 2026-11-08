import { Box } from '@mui/material'

const safeQuantity = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export const formatPassportTons = (value) => {
    const parsed = Number(value)
    if (value == null || !Number.isFinite(parsed)) return '—'

    return `${parsed.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} т`
}

/** Одна компактная шкала: расход / остаток / превышение. */
export default function QualityPassportUsageBar({ issued, used }) {
    const issuedValue = safeQuantity(issued)
    const usedValue = safeQuantity(used)
    const maxValue = Math.max(issuedValue, usedValue, Number.EPSILON)

    const usedWithinLimit = Math.min(usedValue, issuedValue)
    const remaining = Math.max(0, issuedValue - usedValue)
    const exceeded = Math.max(0, usedValue - issuedValue)
    const percent = (value) => `${(value / maxValue) * 100}%`

    const segments = [
        { name: 'Использовано', value: usedWithinLimit, color: '#438DF4' },
        { name: 'Остаток', value: remaining, color: '#38B96A' },
        { name: 'Превышение', value: exceeded, color: 'error.main' },
    ]

    const showBoundary = usedWithinLimit > 0 && (remaining > 0 || exceeded > 0)

    return (
        <Box
            role="img"
            aria-label={`Использовано ${formatPassportTons(usedValue)}, остаток ${formatPassportTons(remaining)}, превышение ${formatPassportTons(exceeded)}`}
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 220px',
                minWidth: 140,
                height: 14,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    width: '100%',
                    height: 3,
                    overflow: 'hidden',
                    borderRadius: '999px',
                    bgcolor: 'action.hover',
                }}
            >
                {segments.map((segment) =>
                    segment.value > 0 ? (
                        <Box
                            key={segment.name}
                            sx={{
                                width: percent(segment.value),
                                height: '100%',
                                bgcolor: segment.color,
                                flexShrink: 0,
                            }}
                        />
                    ) : null,
                )}
            </Box>
            {showBoundary && (
                <Box
                    aria-hidden="true"
                    sx={{
                        position: 'absolute',
                        left: percent(usedWithinLimit),
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: '#FFFFFF',
                        border: '1.5px solid #438DF4',
                        boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.35)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </Box>
    )
}
