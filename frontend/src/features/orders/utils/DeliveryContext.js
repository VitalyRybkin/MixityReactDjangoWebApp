import {createContext, useContext} from "react";

export const DeliveryContext = createContext(null)
export const useDeliveryDetail = () => useContext(DeliveryContext)