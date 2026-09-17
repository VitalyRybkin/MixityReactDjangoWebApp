import {
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
} from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
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
import GroupRoute from './pages/auth/components/GroupRoute.jsx'
import { AuthProvider } from './pages/auth/context/AuthContext.jsx'
import { GROUPS } from './pages/auth/permissions.js'

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
                    <Route element={<GroupRoute groups={[GROUPS.LOGISTIC_MANAGER, GROUPS.ACCOUNTANT]} />}>
                        <Route path="/carriers" element={<CarriersList />} />
                        <Route path="/carriers/:id" element={<CarrierDetailPage />} />
                        <Route path="/carriers/:id/trucks" element={<CarrierTruckListPage />} />

                        <Route path="/carriers/:id/drivers" element={<CarrierDriverListPage />} />

                        <Route path="/warehouses" element={<WarehousesList />} />
                        <Route path="/warehouses/create" element={<WarehouseFormPage />} />
                        <Route path="/warehouses/:id" element={<WarehouseInfoPage />} />
                        <Route path="/warehouses/:id/edit" element={<WarehouseFormPage />} />
                        <Route path="/warehouses/:id/map" element={<WarehouseMapUploadPage />} />

                        <Route path="/clients" element={<ClientsList />} />
                        <Route path="/clients/create" element={<ClientFormPage />} />
                        <Route path="/clients/:id" element={<ClientDetailPage />} />
                        <Route path="/clients/:id/edit" element={<ClientFormPage />} />

                        <Route path="/customers" element={<CustomersList />} />
                        <Route path="/customers/:id" element={<CustomerDetailPage />} />
                        <Route path="/customers/:id/construction_objects" element={<CustomerObjectListPage />} />
                    </Route>
                    <Route element={<GroupRoute groups={[GROUPS.ADMINS]} />}>
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/catalog/products/:id" element={<CatalogPrices />} />
                    </Route>

                    <Route path="/documentation" element={<DocumentationListPage />} />
                    <Route path="/filtering" element={<OrderFilteringPage />} />
                </Route>

                {/* Full-width layout */}
                <Route element={<FullWidthLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/orders/create" element={<OrderFormPage />} />
                    <Route path="/orders/:id/edit" element={<OrderFormPage />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
        </Route>,
    ),
)

function App() {
    return <RouterProvider router={router} />
}

export default App
