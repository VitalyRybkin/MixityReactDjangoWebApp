import { useEffect, useState } from "react";
import api from "../api";
import UniversalListView from "../components/UniversalListView";
import ListInfoCard from "../components/ListInfoCard";

export default function WarehousesList() {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                const res = await api.get("/api/stock/");
                const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
                if (mounted) setWarehouses(data);
            } catch (e) {
                if (mounted) setWarehouses([]); // optional
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <UniversalListView
            title="Склады"
            items={warehouses}
            loading={loading}
            renderRow={(w) => (
                <ListInfoCard
                    title={w.name}
                    subtitle={w.organization}
                    extra={w.address}
                    email={w.email}
                    fileUrl={w.directions}
                    to={`/warehouses/${w.id}`}
                />
            )}
        />
    );
}
