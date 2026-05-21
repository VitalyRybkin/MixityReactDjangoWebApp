import React, { useState } from 'react'

import { Autocomplete, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material'

import { useGetCarrierResources, useGetCarriers } from '../../logistic/carriers/utils/carriers.queries.js'
import { useCurrencyField } from '../hooks/useCurrencyField.js'
import { useDeliveryDetail } from '../utils/DeliveryContext.js'

export default function OrderDeliveryDetail() {
    const { data: delivery, update: updateDelivery } = useDeliveryDetail()
    const { data: carriers = [], isPending: isCarriersLoading } = useGetCarriers()

    const carrierId = delivery?.carrier?.id
        ? Number(delivery.carrier.id)
        : delivery?.carrier
          ? Number(delivery.carrier)
          : null

    const carrier = carriers.find((c) => c.id === carrierId) || null

    const {
        data: carrierResources,
        isPending: isLoadingResources,
        error: resourcesLoadingError,
    } = useGetCarrierResources(carrierId, {
        enabled: Boolean(carrierId),
    })

    const trucks = carrierResources?.trucks || []
    const truckId = delivery?.truck?.id ? Number(delivery.truck.id) : delivery?.truck ? Number(delivery.truck) : null
    const truck = trucks.find((t) => t.id === truckId) || null

    const drivers = carrierResources?.drivers || []
    const driverId = delivery?.driver?.id
        ? Number(delivery.driver.id)
        : delivery?.driver
          ? Number(delivery.driver)
          : null
    const driver = drivers.find((d) => d.id === driverId) || null

    const truckPlate = delivery?.truck?.licensePlate || delivery?.truck?.license_plate || ''
    const truckCapacity = delivery?.truck?.capacity?.capacity || ''

    const deliveryCost = useCurrencyField(delivery?.delivery_cost, (v) => updateDelivery({ delivery_cost: v }))
    const compensation = useCurrencyField(delivery?.delivery_compensation, (v) =>
        updateDelivery({ delivery_compensation: v }),
    )
    const demurrage = useCurrencyField(delivery?.demurrage, (v) => updateDelivery({ demurrage: v }))

    return (
        <>
            <Stack direction="column" alignItems="stretch" spacing={1}>
                <Autocomplete
                    size="small"
                    options={carriers}
                    loading={isCarriersLoading}
                    getOptionLabel={(option) => option?.name || ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={carrier}
                    onChange={(event, newValue) => {
                        updateDelivery({
                            carrier: newValue,
                            driver: null,
                            truck: null,
                        })
                    }}
                    renderInput={(params) => <TextField {...params} label="ТК" />}
                />

                <Autocomplete
                    size="small"
                    disabled={!carrierId}
                    options={trucks}
                    loading={isLoadingResources}
                    getOptionLabel={(option) => {
                        if (!option) return ''
                        const typeObj = option.truckType || option.truck_type
                        return (
                            typeObj?.truckType ||
                            typeObj?.truck_type ||
                            option.licensePlate ||
                            option.license_plate ||
                            ''
                        )
                    }}
                    isOptionEqualToValue={(option, value) => {
                        if (!option || !value) return false
                        return option.id === value.id
                    }}
                    renderOption={(props, option) => {
                        const plate = option.licensePlate || option.license_plate || ''
                        const typeObj = option.truckType || option.truck_type
                        const typeName = typeObj?.truckType || typeObj?.truck_type || ''
                        const capacity = option.capacity?.capacity || ''
                        return (
                            <li {...props} key={option.id}>
                                {`${typeName} (${capacity} т) [${plate}]`}
                            </li>
                        )
                    }}
                    value={truck}
                    onChange={(event, newValue) => {
                        updateDelivery({ truck: newValue })
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Автомобиль"
                            error={Boolean(resourcesLoadingError)}
                            helperText={resourcesLoadingError ? 'Ошибка загрузки автомобилей' : ''}
                        />
                    )}
                />

                {delivery?.truck && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {truckCapacity ? `${truckCapacity} т` : ''}
                        {truckCapacity && truckPlate ? ' · ' : ''}
                        {truckPlate}
                    </Typography>
                )}

                <Autocomplete
                    size="small"
                    disabled={!carrierId}
                    options={drivers}
                    loading={isLoadingResources}
                    getOptionLabel={(option) => option?.fullName || ''}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={driver}
                    onChange={(event, newValue) => {
                        updateDelivery({ driver: newValue })
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Водитель"
                            error={Boolean(resourcesLoadingError)}
                            helperText={resourcesLoadingError ? 'Ошибка загрузки водителей' : ''}
                        />
                    )}
                />

                <Typography variant="body2" sx={{ mt: 2 }}>
                    {'Стоимость:'}
                </Typography>
                <Divider sx={{ my: 1 }} />

                <TextField
                    size="small"
                    label="Доставка"
                    value={deliveryCost.display}
                    onChange={deliveryCost.handleChange}
                    onBlur={deliveryCost.handleBlur}
                    onFocus={deliveryCost.handleFocus}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">₽</InputAdornment> } }}
                />
                <TextField
                    size="small"
                    label="Компенсация"
                    value={compensation.display}
                    onChange={compensation.handleChange}
                    onBlur={compensation.handleBlur}
                    onFocus={compensation.handleFocus}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">₽</InputAdornment> } }}
                />
                <TextField
                    size="small"
                    label="Простой"
                    value={demurrage.display}
                    onChange={demurrage.handleChange}
                    onBlur={demurrage.handleBlur}
                    onFocus={demurrage.handleFocus}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">₽</InputAdornment> } }}
                />
            </Stack>
        </>
    )
}
