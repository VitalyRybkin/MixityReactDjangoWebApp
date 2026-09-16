import { useState } from 'react'

import { Autocomplete, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material'

import AddAction from '../../../components/ui/buttons/AddAction.jsx'
import CarrierDialog from '../../logistic/carriers/CarrierDialog.jsx'
import { useGetCarrierResources, useGetCarriers } from '../../logistic/carriers/utils/carriers.queries.js'
import DriverDialog from '../../logistic/drivers/DriverDialog.jsx'
import TruckDialog from '../../logistic/trucks/TruckDialog.jsx'
import { useCurrencyField } from '../hooks/useCurrencyField.js'
import { useDeliveryDetail } from '../utils/DeliveryContext.js'

export default function OrderDeliveryDetail() {
    const { data: delivery, update: updateDelivery } = useDeliveryDetail()

    const [carrierDialogOpen, setCarrierDialogOpen] = useState(false)
    const [truckDialogOpen, setTruckDialogOpen] = useState(false)
    const [driverDialogOpen, setDriverDialogOpen] = useState(false)

    const { data: carriers = [], isPending: isCarriersLoading, refetch: refetchCarriers } = useGetCarriers()

    const carrierId = delivery?.carrier?.id
        ? Number(delivery.carrier.id)
        : delivery?.carrier
          ? Number(delivery.carrier)
          : null

    const carrier =
        carriers.find((item) => Number(item.id) === carrierId) ||
        (delivery?.carrier && typeof delivery.carrier === 'object' ? delivery.carrier : null)

    const {
        data: carrierResources,
        isPending: isLoadingResources,
        error: resourcesLoadingError,
        refetch: refetchCarrierResources,
    } = useGetCarrierResources(carrierId, {
        enabled: Boolean(carrierId),
    })

    const trucks = carrierResources?.trucks || []

    const truckId = delivery?.truck?.id ? Number(delivery.truck.id) : delivery?.truck ? Number(delivery.truck) : null

    const truck =
        trucks.find((item) => Number(item.id) === truckId) ||
        (delivery?.truck && typeof delivery.truck === 'object' ? delivery.truck : null)

    const drivers = carrierResources?.drivers || []

    const driverId = delivery?.driver?.id
        ? Number(delivery.driver.id)
        : delivery?.driver
          ? Number(delivery.driver)
          : null

    const driver =
        drivers.find((item) => Number(item.id) === driverId) ||
        (delivery?.driver && typeof delivery.driver === 'object' ? delivery.driver : null)

    const truckPlate = truck?.licensePlate || truck?.license_plate || ''

    const truckCapacity = truck?.capacity?.capacity || ''

    const deliveryCost = useCurrencyField(delivery?.delivery_cost, (value) =>
        updateDelivery({
            delivery_cost: value,
        }),
    )

    const compensation = useCurrencyField(delivery?.delivery_compensation, (value) =>
        updateDelivery({
            delivery_compensation: value,
        }),
    )

    const demurrage = useCurrencyField(delivery?.demurrage, (value) =>
        updateDelivery({
            demurrage: value,
        }),
    )

    const handleCarrierCreated = async (created) => {
        const { data } = await refetchCarriers()

        const selected = data?.find((item) => Number(item.id) === Number(created.id)) ?? created

        updateDelivery({
            carrier: selected,
            driver: null,
            truck: null,
        })

        setCarrierDialogOpen(false)
    }

    const handleTruckCreated = async (created) => {
        const { data } = await refetchCarrierResources()

        const selected = data?.trucks?.find((item) => Number(item.id) === Number(created.id)) ?? created

        updateDelivery({
            truck: selected,
        })

        setTruckDialogOpen(false)
    }

    const handleDriverCreated = async (created) => {
        const { data } = await refetchCarrierResources()

        const selected = data?.drivers?.find((item) => Number(item.id) === Number(created.id)) ?? created

        updateDelivery({
            driver: selected,
        })

        setDriverDialogOpen(false)
    }

    return (
        <>
            <Stack direction="column" alignItems="stretch" spacing={1}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
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
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить ТК"
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setCarrierDialogOpen(true)
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="flex-start">
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
                            updateDelivery({
                                truck: newValue,
                            })
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Автомобиль"
                                error={Boolean(resourcesLoadingError)}
                                helperText={resourcesLoadingError ? 'Ошибка загрузки автомобилей' : ''}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить автомобиль"
                        disabled={!carrierId}
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setTruckDialogOpen(true)
                        }}
                    />
                </Stack>

                {truck && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                            display: 'block',
                        }}
                    >
                        {truckCapacity ? `${truckCapacity} т` : ''}
                        {truckCapacity && truckPlate ? ' · ' : ''}
                        {truckPlate}
                    </Typography>
                )}

                <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Autocomplete
                        size="small"
                        disabled={!carrierId}
                        options={drivers}
                        loading={isLoadingResources}
                        getOptionLabel={(option) => option?.fullName || ''}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        value={driver}
                        onChange={(event, newValue) => {
                            updateDelivery({
                                driver: newValue,
                            })
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Водитель"
                                error={Boolean(resourcesLoadingError)}
                                helperText={resourcesLoadingError ? 'Ошибка загрузки водителей' : ''}
                            />
                        )}
                        sx={{ flex: 1 }}
                    />

                    <AddAction
                        title="Добавить водителя"
                        disabled={!carrierId}
                        onClick={(event) => {
                            event.currentTarget.blur()
                            setDriverDialogOpen(true)
                        }}
                    />
                </Stack>

                <Typography variant="body2" sx={{ mt: 2 }}>
                    Стоимость:
                </Typography>

                <Divider sx={{ my: 1 }} />

                <TextField
                    size="small"
                    label="Доставка"
                    value={deliveryCost.display}
                    onChange={deliveryCost.handleChange}
                    onBlur={deliveryCost.handleBlur}
                    onFocus={deliveryCost.handleFocus}
                    slotProps={{
                        input: {
                            endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        },
                    }}
                />

                <TextField
                    size="small"
                    label="Компенсация"
                    value={compensation.display}
                    onChange={compensation.handleChange}
                    onBlur={compensation.handleBlur}
                    onFocus={compensation.handleFocus}
                    slotProps={{
                        input: {
                            endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        },
                    }}
                />

                <TextField
                    size="small"
                    label="Простой"
                    value={demurrage.display}
                    onChange={demurrage.handleChange}
                    onBlur={demurrage.handleBlur}
                    onFocus={demurrage.handleFocus}
                    slotProps={{
                        input: {
                            endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                        },
                    }}
                />
            </Stack>

            <CarrierDialog
                open={carrierDialogOpen}
                mode="create"
                onClose={() => setCarrierDialogOpen(false)}
                onSaved={handleCarrierCreated}
            />

            <TruckDialog
                open={truckDialogOpen}
                mode="create"
                carrierId={carrierId}
                onClose={() => setTruckDialogOpen(false)}
                onSaved={handleTruckCreated}
            />

            <DriverDialog
                open={driverDialogOpen}
                mode="create"
                carrierId={carrierId}
                onClose={() => setDriverDialogOpen(false)}
                onSaved={handleDriverCreated}
            />
        </>
    )
}
