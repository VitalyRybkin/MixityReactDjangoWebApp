// --- UTILS ---
import {repairCompaniesApiPaths} from "./repairApiPaths.js";
import api from "../../../api.js";
import {useQuery} from "@tanstack/react-query";

const unwrapList = (data) => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.results)) return data.results
    return []
}

// --- QUERY KEYS ---
export const repairCompaniesKeys = {
    all: ['repairCompanies'],
    list: () => [...repairCompaniesKeys.all, 'list'],
    detail: (id) => [...repairCompaniesKeys.all, 'detail', String(id)],
    contacts: (id) => [...repairCompaniesKeys.all, 'detail', String(id), 'contacts'],
}

// --- API FUNCTIONS ---

export const fetchRepairCompanies = async () => {
    const response = await api.get(repairCompaniesApiPaths.listCreate())
    return unwrapList(response.data)
}

// export const fetchRepairCompanyDetail = async(id) => {
//     const response = await api.get(repairCompaniesApiPaths.detail(id))
//     return response.data
// }

// --- HOOKS ---

export function useGetRepairCompanies() {
    return useQuery({
        queryKey: repairCompaniesKeys.list(),
        queryFn: fetchRepairCompanies,
    })
}
