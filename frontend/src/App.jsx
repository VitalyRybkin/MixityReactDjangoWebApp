import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import ClientDetailPage from './features/clients/ClientDetail.jsx'
import ClientFormPage from './features/clients/ClientForm.jsx'
import ClientsList from './features/clients/ClientsList.jsx'
import DocumentationListPage from './features/common/DocumentationList.jsx'
import CustomerDetailPage from './features/customers/CustomerDetail.jsx'
import CustomerFormPage from './features/customers/CustomerForm.jsx'
import CustomerObjectListPage from './features/customers/CustomerObjectList.jsx'
import CustomersList from './features/customers/CustomersList.jsx'
import CarrierDetailPage from './features/logistic/carriers/CarrierDetail.jsx'
import CarrierFormPage from './features/logistic/carriers/CarrierForm.jsx'
import CarriersList from './features/logistic/carriers/CarriersList.jsx'
import DriverFormPage from './features/logistic/drivers/CarrierDriverForm.jsx'
import CarrierDriverListPage from './features/logistic/drivers/CarrierDriverList.jsx'
import TruckFormPage from './features/logistic/trucks/CarrierTruckForm.jsx'
import CarrierTruckListPage from './features/logistic/trucks/CarrierTruckList.jsx'
import WarehouseInfoPage from './features/warehouses/stocks/WarehouseDetail.jsx'
import WarehouseFormPage from './features/warehouses/stocks/WarehouseForm.jsx'
import WarehouseMapUploadPage from './features/warehouses/stocks/WarehouseMapUpload.jsx'
import WarehousesList from './features/warehouses/stocks/WarehousesList.jsx'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import ConstructionObjectFormPage from "./features/customers/ConstructionObjectForm.jsx";

function Logout() {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
    return <Navigate to="/login" replace />
}

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />

            {/* Protected + Layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Home />} />
                <Route path="/carriers" element={<CarriersList />} />
                <Route path="/carriers/create" element={<CarrierFormPage />} />
                <Route path="/carriers/:id" element={<CarrierDetailPage />} />
                <Route path="/carriers/:id/edit" element={<CarrierFormPage />} />
                <Route path="/carriers/:id/trucks" element={<CarrierTruckListPage />} />
                <Route path="/carriers/:carrierId/trucks/create" element={<TruckFormPage />} />
                <Route path="/carriers/:carrierId/trucks/:truckId/edit" element={<TruckFormPage />} />
                <Route path="/carriers/:id/drivers" element={<CarrierDriverListPage />} />
                <Route path="/carriers/:carrierId/drivers/create" element={<DriverFormPage />} />
                <Route path="/carriers/:carrierId/drivers/:driverId/edit" element={<DriverFormPage />} />

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
                <Route path="/customers/create" element={<CustomerFormPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
                <Route path="/customers/:id/construction_objects" element={<CustomerObjectListPage />} />
                <Route path="/customers/:id/construction_objects/:objectId/edit" element={<ConstructionObjectFormPage />} />
                <Route path="/customers/:id/construction_objects/create" element={<ConstructionObjectFormPage />} />

                <Route path="/documentation" element={<DocumentationListPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
