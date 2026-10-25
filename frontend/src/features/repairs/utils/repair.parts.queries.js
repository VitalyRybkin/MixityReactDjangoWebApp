import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {REFERENCE_STALE_TIME} from "../../../utils/query.constants.js";
import api from "../../../api.js";
import {repairRequestPartsApiPaths} from "./repairApiPaths.js";
import {unwrapList} from "./repair.queries.js";

export const repairRequestPartsKeys = {
    all: ['repairRequestParts'],
    list: () => [...repairRequestPartsKeys.all, 'list'],
    detail: (id) => [...repairRequestPartsKeys.all, 'detail', String(id)],
}

// --- API FUNCTIONS

export const fetchSpareParts = async () => {
    const response = await api.get(repairRequestPartsApiPaths.listCreate())
    return unwrapList(response.data)
}

export const createSparePart = async (payload) => {
    const response = await api.post(
        repairRequestPartsApiPaths.listCreate(),
        payload,
    )

    return response.data
}

export const fetchSparePartDetail = async (id) => {
    const response = await api.get(repairRequestPartsApiPaths.detail(id))
    return response.data
}

// --- HOOKS FOR SPARE PARTS ---

export function useGetSpareParts() {
    return useQuery({
        queryKey: repairRequestPartsKeys.list(),
        queryFn: fetchSpareParts,
        staleTime: REFERENCE_STALE_TIME,
    })
}

export function useCreateSparePart() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createSparePart,

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: repairRequestPartsKeys.list(),
            })
        },
    })
}

export function useSparePartDetail(id) {
    return useQuery({
        queryKey: repairRequestPartsKeys.detail(id),
        queryFn: () => fetchSparePartDetail(id),
        enabled: Boolean(id),
    })
}