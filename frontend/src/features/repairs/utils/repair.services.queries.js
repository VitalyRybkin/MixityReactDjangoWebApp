import {useQuery} from "@tanstack/react-query";
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

export function useRepairServiceDetail(id) {
    return useQuery({
        queryKey: repairRequestServicesKeys.detail(id),
        queryFn: () => fetchRepairServiceDetail(id),
        enabled: Boolean(id),
    })
}