import React from 'react'

import {Autocomplete, Divider, Stack, TextField, Typography} from '@mui/material'

import { useGetCarrierResources, useGetCarriers } from '../../logistic/carriers/utils/carriers.queries.js'
import { useDeliveryDetail } from '../OrderForm.jsx'

export default function OrderDeliveryDetail() {
    const { data: delivery, update: updateDelivery } = useDeliveryDetail()
    const { data: carriers = [], isPending: isCarriersLoading } = useGetCarriers()

    const carrierId = delivery?.carrier?.id ? Number(delivery.carrier.id) : null

    const {
        data: carrierResources,
        isPending: isLoadingResources,
        error: resourcesLoadingError,
    } = useGetCarrierResources(carrierId, {
        enabled: Boolean(carrierId),
    })

    const trucks = carrierResources?.trucks || []
    const drivers = carrierResources?.drivers || []

    console.log(delivery)

    return (
        <>
            <Stack direction="column" alignItems="stretch" spacing={1} >
            <Autocomplete
                size="small"
                options={carriers}
                loading={isCarriersLoading}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={delivery?.carrier || null}
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
                    return typeObj?.truckType || typeObj?.truck_type || option.licensePlate || option.license_plate || ''
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
                        <li {...props}>
                            {`${typeName} (${capacity} т) [${plate}]`}
                        </li>
                    )
                }}
                value={delivery?.truck || null}
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

            {delivery?.truck && (() => {
                const truck = delivery.truck
                const plate = truck.licensePlate || truck.license_plate || ''
                const capacity = truck.capacity?.capacity || ''
                return (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {capacity ? `${capacity} т` : ''}{capacity && plate ? ' · ' : ''}{plate}
                    </Typography>
                )
            })()}

            <Autocomplete
                size="small"
                disabled={!carrierId}
                options={drivers}
                loading={isLoadingResources}
                getOptionLabel={(option) => option?.fullName || ''}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={delivery?.driver || null}
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

                <Typography variant="body2" sx={{ mt: 2}}>
                    {"Стоимость:"}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <TextField
                    size="small"
                    type="number"
                    label={"Доставка"}
                    // value={item.current_display_price ?? ''}
                    onChange={(e) => {
                        updateDelivery({
                            delivery_cost: e.target.value,
                        })
                    }}
                />
                <TextField
                    size="small"
                    type="number"
                    label={"Компенсация"}
                    // value={item.current_display_price ?? ''}
                    onChange={(e) => {
                        updateDelivery({
                            delivery_compensation: e.target.value,
                        })
                    }}
                />
                <TextField
                    size="small"
                    type="number"
                    label={"Простой"}
                    // value={item.current_display_price ?? ''}
                    onChange={(e) => {
                        updateDelivery({
                            demurrage: e.target.value,
                        })
                    }}
                />
            </Stack>
        </>
    )
}
