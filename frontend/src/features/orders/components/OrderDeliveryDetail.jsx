import React from 'react'

import { Autocomplete, TextField } from '@mui/material'

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

    console.log('Carrier Resources:', carrierResources)

    return (
        <>
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
                sx={{ mt: 1 }}
            />

            <Autocomplete
                size="small"
                disabled={!carrierId}
                options={trucks}
                loading={isLoadingResources}
                getOptionLabel={(option) => {
                    if (!option) return ''
                    const plate = option.licensePlate || option.license_plate || ''
                    const typeObj = option.truckType || option.truck_type
                    const typeName = typeObj?.truckType || typeObj?.truck_type || ''
                    const capacityObj = option.capacity || option.capacity
                    const capacity = capacityObj?.capacity || capacityObj?.capacity || ''

                    return typeName ? `${typeName} (${capacity} т) [${plate}] ` : plate
                }}
                isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return false
                    return option.id === value.id
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
                sx={{ mt: 1 }}
            />

            <Autocomplete
                size="small"
                disabled={!carrierId}
                options={drivers}
                loading={isLoadingResources}
                // 🌟 Добавлено: отображение ФИО водителя из вашего JSON (fullName)
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
                sx={{ mt: 1 }}
            />
        </>
    )
}
