import api from '../../../api.js'
import { makeParams } from './additionalServices.logic.js'

export const additionalServicePaths = {
    list: '/api/additional_services/',
    detail: (id) => `/api/additional_services/${id}/`,
    providers: '/api/additional_services/providers/',
}

export const getAdditionalServices = async (filters, page) => {
    const { data } = await api.get(additionalServicePaths.list, { params: makeParams(filters, page) })
    return data
}

export const getAdditionalService = async (id) => {
    const { data } = await api.get(additionalServicePaths.detail(id))
    return data
}

export const createAdditionalService = async (payload) => {
    const { data } = await api.post(additionalServicePaths.list, payload)
    return data
}

export const updateAdditionalService = async ({ id, payload }) => {
    const { data } = await api.patch(additionalServicePaths.detail(id), payload)
    return data
}

export const deleteAdditionalService = async (id) => {
    await api.delete(additionalServicePaths.detail(id))
    return id
}

export const getAdditionalServiceProviders = async (providerType) => {
    const { data } = await api.get(additionalServicePaths.providers, {
        params: { type: providerType },
    })
    return data
}
