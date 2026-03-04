import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants.js'
import CarrierCreateUpdatePage from './pages/carriers/CarrierCreateUpdate.jsx'
import CarrierInfoPage from './pages/carriers/CarrierInfo.jsx'
import CarriersList from './pages/carriers/CarriersList.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MainLayout from './layouts/MainLayout'
import NotFound from './pages/NotFound.jsx'
import WarehouseInfoPage from './pages/warehouses/WarehouseInfo.jsx'
import WarehousesList from './pages/warehouses/WarehousesList.jsx'

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
                <Route path="/carriers/:id/edit" element={<CarrierCreateUpdatePage />} />
                <Route path="/warehouses/:id" element={<WarehouseInfoPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default App
