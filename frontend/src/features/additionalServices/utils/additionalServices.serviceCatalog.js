import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../../api.js'
import { REFERENCE_STALE_TIME } from '../../../utils/query.constants.js'

const url = '/api/additional_services/services/'
const key = ['additionalServices', 'specialistServices']

export const fetchAdditionalRepairServices = async () => {
    const response = await api.get(url)
    return Array.isArray(response.data) ? response.data : response.data?.results || []
}

export const createAdditionalRepairService = async (name) => {
    const response = await api.post(url, { name })
    return response.data
}

export const useAdditionalRepairServices = (enabled = true) => useQuery({
    queryKey: key,
    queryFn: fetchAdditionalRepairServices,
    staleTime: REFERENCE_STALE_TIME,
    enabled,
})

export const useCreateAdditionalRepairService = () => {
    const client = useQueryClient()
    return useMutation({
        mutationFn: createAdditionalRepairService,
        onSuccess: () => client.invalidateQueries({ queryKey: key }),
    })
}
