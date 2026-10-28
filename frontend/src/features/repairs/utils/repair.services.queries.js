import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {REFERENCE_STALE_TIME} from "../../../utils/query.constants.js";
import api from "../../../api.js";
import {repairRequestServicesApiPaths} from "./repairApiPaths.js";
import {unwrapList} from "./repair.queries.js";

export const repairRequestServicesKeys = {
    all: ['repairRequestServices'],
    list: () => [...repairRequestServicesKeys.all, 'list'],
    detail: (id) => [...repairRequestServicesKeys.all, 'detail', String(id)],
}

// --- API FUNCTIONS

export const fetchRepairServices = async () => {
    const response = await api.get(repairRequestServicesApiPaths.listCreate())
    return unwrapList(response.data)
}

export const createRepairService = async (payload) => {
    const response = await api.post(
        repairRequestServicesApiPaths.listCreate(),
        payload,
    )

    return response.data
}

export const fetchRepairServiceDetail = async (id) => {
    const response = await api.get(repairRequestServicesApiPaths.detail(id))
    return response.data
}

// --- HOOKS ---

export function useGetRepairServices() {
    return useQuery({
        queryKey: repairRequestServicesKeys.list(),
        queryFn: fetchRepairServices,
        staleTime: REFERENCE_STALE_TIME,
    })
}

export function useCreateRepairService() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createRepairService,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: repairRequestServicesKeys.list(),
            })
        },
    })
}

export function useRepairServiceDetail(id) {
    return useQuery({
        queryKey: repairRequestServicesKeys.detail(id),
        queryFn: () => fetchRepairServiceDetail(id),
        enabled: Boolean(id),
    })
}