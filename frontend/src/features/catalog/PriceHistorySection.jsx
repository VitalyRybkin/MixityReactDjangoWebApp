import React from 'react'
import { Link } from 'react-router-dom'

import { Box, Stack, Typography } from '@mui/material'

import AddAction from '../../components/ui/buttons/AddAction.jsx'

import { styles } from './CatalogProduct.styles.js'

const formatDate = (date) => {
    if (!date) {
        return ''
    }

    const [year, month, day] = date.split('-')

    return `${day}.${month}.${year}`
}

export default function PriceHistorySection({ title, groups, priceField, editBasePath, from, onAdd }) {
    return (
        <Box sx={styles.section}>
            <Box sx={styles.sectionHeader}>
                <Typography variant="h5" sx={styles.sectionTitle}>
                    {title}
                </Typography>

                <AddAction onClick={onAdd} />
            </Box>

            {groups.length > 0 ? (
                <Stack
                    spacing={{
                        xs: 2,
                        sm: 3,
                    }}
                >
                    {groups.map(({ entity, prices }) => (
                        <Box key={entity.id} sx={styles.group}>
                            <Typography variant="subtitle1" sx={styles.groupTitle}>
                                {entity.name}
                            </Typography>

                            {prices.map((price) => (
                                <Box
                                    key={price.id}
                                    component={Link}
                                    to={`${editBasePath}/${price.id}/edit`}
                                    state={{ from }}
                                    sx={styles.priceRow}
                                >
                                    <Typography variant="body2" sx={styles.date}>
                                        {formatDate(price.date)}
                                    </Typography>

                                    <Typography variant="body2" sx={styles.price}>
                                        {price[priceField]} ₽
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Stack>
            ) : (
                <Typography color="text.secondary" sx={styles.empty}>
                    Цены не добавлены
                </Typography>
            )}
        </Box>
    )
}
