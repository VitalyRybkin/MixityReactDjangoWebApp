import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import CarrierDetailPage from './pages/carriers/CarrierDetail.jsx'
import CarrierFormPage from './pages/carriers/CarrierForm.jsx'
import CarriersList from './pages/carriers/CarriersList.jsx'
import WarehouseInfoPage from './pages/warehouses/WarehouseDetail.jsx'
import WarehousesList from './pages/warehouses/WarehousesList.jsx'
import WarehouseFormPage from "./pages/warehouses/WarehousForm.jsx";

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
                <Route path="/carrier/create" element={<CarrierFormPage />} />
                <Route path="/carrier/:id" element={<CarrierDetailPage />} />
                <Route path="/carrier/:id/edit" element={<CarrierFormPage />} />

                <Route path="/warehouses" element={<WarehousesList />} />
                <Route path="/warehouse/create" element={<WarehouseFormPage />} />
                <Route path="/warehouse/:id" element={<WarehouseInfoPage />} />
                <Route path="/warehouse/:id/edit" element={<WarehouseFormPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
