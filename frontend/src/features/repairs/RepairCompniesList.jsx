import {useGetRepairCompanies} from "./utils/repair.queries.js";

export default function RepairCompaniesList() {
    const { data: repairCompanies, isPending, error, refetch } = useGetRepairCompanies()
}