import { useEffect, useState } from "react";
import api from "../api";
import UniversalListView from "../components/UniversalListView";
import ListInfoCard from "../components/ListInfoCard";

export default function CarriersPage() {
    const [carriers, setCarriers] = useState([]);

    useEffect(() => {
        api.get("/api/logistic/carriers/").then((res) => {
            const data = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
            setCarriers(data);
        });
    }, []);

    return (
        <UniversalListView
            title="Грузоперевозчики"
            items={carriers}
            renderRow={(w) => (
                <ListInfoCard
                    title={w.name}
                    subtitle={w.fullName}
                    extra={w.address}
                    email={w.email}
                    to={`/carriers/${w.id}`}
                />
            )}
        />
    );
}
