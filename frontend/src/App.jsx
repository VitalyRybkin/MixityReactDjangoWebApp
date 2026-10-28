import {
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
} from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import GlobalApiErrorSnackbar from './components/ui/feedback/GlobalApiErrorSnackbar.jsx'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import CatalogPage from './features/catalog/Catalog.jsx'
import CatalogPrices from './features/catalog/CatalogPrices.jsx'
import ClientDetailPage from './features/clients/ClientDetail.jsx'
import ClientFormPage from './features/clients/ClientForm.jsx'
import ClientsList from './features/clients/ClientsList.jsx'
import DocumentationListPage from './features/common/DocumentationList.jsx'
import CustomerDetailPage from './features/customers/CustomerDetail.jsx'
import CustomerObjectListPage from './features/customers/CustomerObjectList.jsx'
import CustomersList from './features/customers/CustomersList.jsx'
import CarrierDetailPage from './features/logistic/carriers/CarrierDetail.jsx'
import CarriersList from './features/logistic/carriers/CarriersList.jsx'
import CarrierDriverListPage from './features/logistic/drivers/CarrierDriverList.jsx'
import CarrierTruckListPage from './features/logistic/trucks/CarrierTruckList.jsx'
import OrderFilteringPage from './features/orders/OrderFilteringPage.jsx'
import OrderFormPage from './features/orders/OrderForm.jsx'
import RepairCompanyDetailPage from './features/repairs/RepairCompanyDetail.jsx'
import RepairCompanyFormPage from './features/repairs/RepairCompanyForm.jsx'
import RepairCompaniesList from './features/repairs/RepairCompniesList.jsx'
import RepairRequestFormPage from './features/repairs/RepairRequestForm.jsx'
import RepairRequestListPage from './features/repairs/RepairRequestList.jsx'
import WarehouseInfoPage from './features/warehouses/WarehouseDetail.jsx'
import WarehouseFormPage from './features/warehouses/WarehouseForm.jsx'
import WarehouseMapUploadPage from './features/warehouses/WarehouseMapUpload.jsx'
import WarehousesList from './features/warehouses/WarehousesList.jsx'
import FullWidthLayout from './layouts/FullWidthLayout.jsx'
import MainLayout from './layouts/MainLayout'
import Forbidden from './pages/Forbidden.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import PermissionRoute from './pages/auth/components/PermissionRoute.jsx'
import { AuthProvider } from './pages/auth/context/AuthContext.jsx'
import { PERMISSIONS } from './pages/auth/permissions.js'

function Logout() {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
    return <Navigate to="/login" replace />
}

function AuthenticatedApp() {
    return (
        <ProtectedRoute>
            <AuthProvider>
                <Outlet />
            </AuthProvider>
        </ProtectedRoute>
    )
}

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/401" element={<Unauthorized />} />

            {/* All authenticated routes share one AuthProvider */}
            <Route element={<AuthenticatedApp />}>
                {/* Standard layout */}
                <Route element={<MainLayout />}>
                    {/* Carriers */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.carriers.view} />}>
                        <Route path="/carriers" element={<CarriersList />} />
                        <Route path="/carriers/:id" element={<CarrierDetailPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.trucks.view} />}>
                        <Route path="/carriers/:id/trucks" element={<CarrierTruckListPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.drivers.view} />}>
                        <Route path="/carriers/:id/drivers" element={<CarrierDriverListPage />} />
                    </Route>

                    {/* Warehouses */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.warehouses.view} />}>
                        <Route path="/warehouses" element={<WarehousesList />} />
                        <Route path="/warehouses/:id" element={<WarehouseInfoPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.warehouses.add} />}>
                        <Route path="/warehouses/create" element={<WarehouseFormPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.warehouses.change} />}>
                        <Route path="/warehouses/:id/edit" element={<WarehouseFormPage />} />
                        <Route path="/warehouses/:id/map" element={<WarehouseMapUploadPage />} />
                    </Route>

                    {/* Clients */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.clients.view} />}>
                        <Route path="/clients" element={<ClientsList />} />
                        <Route path="/clients/:id" element={<ClientDetailPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.clients.add} />}>
                        <Route path="/clients/create" element={<ClientFormPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.clients.change} />}>
                        <Route path="/clients/:id/edit" element={<ClientFormPage />} />
                    </Route>

                    {/* Customers */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.customers.view} />}>
                        <Route path="/customers" element={<CustomersList />} />
                        <Route path="/customers/:id" element={<CustomerDetailPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.constructionObjects.view} />}>
                        <Route path="/customers/:id/construction_objects" element={<CustomerObjectListPage />} />
                    </Route>

                    {/* Repair companies */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.repairCompanies.view} />}>
                        <Route path="/repair/companies" element={<RepairCompaniesList />} />
                        <Route path="/repair/companies/:id" element={<RepairCompanyDetailPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.repairCompanies.add} />}>
                        <Route path="/repair/companies/create" element={<RepairCompanyFormPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.repairCompanies.change} />}>
                        <Route path="/repair/companies/:id/edit" element={<RepairCompanyFormPage />} />
                    </Route>

                    {/* Catalog */}
                    <Route element={<PermissionRoute permission={PERMISSIONS.catalog.view} />}>
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/catalog/products/:id" element={<CatalogPrices />} />
                    </Route>

                    <Route path="/documentation" element={<DocumentationListPage />} />
                    <Route element={<PermissionRoute permission={PERMISSIONS.orders.view} />}>
                        <Route path="/filtering" element={<OrderFilteringPage />} />
                    </Route>
                    <Route element={<PermissionRoute permission={PERMISSIONS.repairRequests.view} />}>
                        <Route path="/repair/requests" element={<RepairRequestListPage />} />
                        <Route path="/repair/requests/:id" element={<RepairRequestFormPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.repairRequests.add} />}>
                        <Route path="/repair/requests/create" element={<RepairRequestFormPage />} />
                    </Route>
                </Route>

                {/* Full-width layout */}
                <Route element={<FullWidthLayout />}>
                    <Route path="/" element={<Home />} />

                    <Route element={<PermissionRoute permission={PERMISSIONS.orders.view} />}>
                        <Route path="/orders/:id" element={<OrderFormPage readOnly />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.orders.add} />}>
                        <Route path="/orders/create" element={<OrderFormPage />} />
                    </Route>

                    <Route element={<PermissionRoute permission={PERMISSIONS.orders.change} />}>
                        <Route path="/orders/:id/edit" element={<OrderFormPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
        </Route>,
    ),
)

function App() {
    return (
        <>
            <RouterProvider router={router} />
            <GlobalApiErrorSnackbar />
        </>
    )
}

export default App
