import { useLocation, useNavigate } from 'react-router-dom';



import { Box, Divider } from '@mui/material';



import AppBreadcrumbs from '../../components/AppBreadcrumbs.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import DownloadAction from '../../components/ui/buttons/DownloadAction.jsx';
import { useGetCustomerObjects, useGetCustomers } from '../customers/utils/customers.queries.js';
import { orderFilteringPageSx as sx } from '../orders/OrderFilteringPage.styles.js';



import { useGetRepairCompanies } from './utils/repair.queries.js'


































export default function RepairRequestListPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const entity = location.state?.entity

    const { data: customers = [] } = useGetCustomers()
    const { data: repairCompanies = [] } = useGetRepairCompanies()
    const { data: customerObjects = [] } = useGetCustomerObjects()

    return (
        <Box sx={sx.page}>
            <AppBreadcrumbs dynamicLabels={entity ? { id: entity.name } : {}} />

            <PageHeader
                title="Ремонт"
                actions={
                    <DownloadAction
                        title="Экспорт в Excel"
                        // onClick={handleExport}
                        // disabled={isDownloading || loadingOrders}
                        // loading={isDownloading || loadingOrders}
                    />
                }
            />

            <Divider />

        </Box>
    )
}