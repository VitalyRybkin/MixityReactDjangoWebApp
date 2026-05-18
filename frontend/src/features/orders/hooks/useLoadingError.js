import { useEffect } from "react";

export function useLoadingError(setError, {
    loadResourceError,
    loadOrderError,
    loadCustomerPricesError,
    loadWarehousePricesError,
}) {

    useEffect(() => {
        if (loadResourceError) {
            setError(loadResourceError?.response?.data?.detail || 'Ошибка загрузки данных');
        } else if (loadOrderError) {
            setError(loadOrderError?.response?.data?.detail || 'Ошибка загрузки заказа');
        } else if (loadCustomerPricesError) {
            setError(loadCustomerPricesError?.response?.data?.detail || 'Ошибка загрузки цен клиента');
        } else if (loadWarehousePricesError) {
            setError(loadWarehousePricesError?.response?.data?.detail || 'Ошибка загрузки цен склада');
        } else {
            setError(null);
        }
    }, [loadResourceError, loadOrderError, loadCustomerPricesError, loadWarehousePricesError, setError])
}
