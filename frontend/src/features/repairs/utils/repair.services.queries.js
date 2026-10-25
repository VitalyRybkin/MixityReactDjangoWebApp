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

export const fetchRequestServices = async () => {
    const response = await api.get(repairRequestServicesApiPaths.listCreate())
    return unwrapList(response.data)
}

export const fetchRequestServiceDetail = async (id) => {
    const response = await api.get(repairRequestServicesApiPaths.detail(id))
    return response.data
}

// --- HOOKS FOR SPARE PARTS ---

export function useGetRequestServices() {
    return useQuery({
        queryKey: repairRequestServicesKeys.list(),
        queryFn: () => fetchRequestServices(),
        staleTime: REFERENCE_STALE_TIME,
    })
}

export function useRequestServiceDetail(id) {
    return useQuery({
        queryKey: repairRequestServicesKeys.detail(id),
        queryFn: () => fetchRequestServiceDetail(id),
        enabled: Boolean(id),
    })
}