import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import CarrierDetailPage from './layout/CarrierDetail.jsx'
import CarrierInfoPage from './layout/CarrierInfo.jsx'
import CarriersList from './layout/CarriersList.jsx'
import Home from './layout/Home'
import Login from './layout/Login'
import MainLayout from './layout/MainLayout'
import NotFound from './layout/NotFound'
import WarehouseInfoPage from './layout/WarehouseInfo.jsx'
import WarehousesList from './layout/WarehousesList.jsx'

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
                <Route path="/warehouses" element={<WarehousesList />} />
                <Route path="/carriers" element={<CarriersList />} />
                <Route path="/carriers/:id" element={<CarrierInfoPage />} />
                <Route path="/carriers/:id/edit" element={<CarrierDetailPage />} />
                <Route path="/warehouses/:id" element={<WarehouseInfoPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
