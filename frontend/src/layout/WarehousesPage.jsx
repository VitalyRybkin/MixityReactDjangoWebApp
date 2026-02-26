import { useEffect, useState } from "react";
import api from "../api";
import UniversalListView from "../components/UniversalListView";
import ListInfoCard from "../components/ListInfoCard";

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState([]);

    useEffect(() => {
        api.get("/api/stock/").then((res) => {
            const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
            setWarehouses(data);
        });
    }, []);

    return (
        <UniversalListView
            title="Склады"
            items={warehouses}
            renderRow={(w) => (
                <ListInfoCard
                    title={w.name}
                    subtitle={w.organization}
                    extra={w.address}
                    email={w.email}
                    fileUrl={w.directions}
                    to={`/warehouse/${w.id}`}
                />
            )}
        />
    );
}
