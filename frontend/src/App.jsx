import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import CarrierDetailPage from './features/logistic/carriers/CarrierDetail.jsx'
import CarrierFormPage from './features/logistic/carriers/CarrierForm.jsx'
import CarriersList from './features/logistic/carriers/CarriersList.jsx'
import WarehouseInfoPage from './features/warehouses/stocks/WarehouseDetail.jsx'
import WarehousesList from './features/warehouses/stocks/WarehousesList.jsx'
import WarehouseFormPage from "./features/warehouses/stocks/WarehousForm.jsx";

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

                <Route path="/warehouses" element={<WarehousesList />} />
                <Route path="/warehouses/create" element={<WarehouseFormPage />} />
                <Route path="/warehouses/:id" element={<WarehouseInfoPage />} />
                <Route path="/warehouses/:id/edit" element={<WarehouseFormPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
