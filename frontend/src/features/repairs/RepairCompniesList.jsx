import {useDeleteRepairCompany, useGetRepairCompanies} from "./utils/repair.queries.js";
import useConfirm from "../../hooks/useConfirm.js";
import useSnackbar from "../../hooks/useSnackbar.js";
import {useConfirmDelete} from "../../hooks/useConfirmDelete.js";
import ObjectListView from "../../components/ObjectListView.jsx";
import ObjectListViewRow from "../../components/ObjectListViewRow.jsx";
import ConfirmDialog from "../../components/ui/feedback/ConfirmDialog.jsx";
import AppSnackbar from "../../components/ui/feedback/AppSnackbar.jsx";

export default function RepairCompaniesList() {
    const { data: repairCompanies, isPending, error, refetch } = useGetRepairCompanies()
    const deleteRepairCompany = useDeleteRepairCompany()

    const { confirm, askConfirm, closeConfirm, handleConfirm } = useConfirm()
    const {snack, showSnackbar, closeSnackbar} = useSnackbar()

    const confirmDelete = useConfirmDelete({
        askConfirm,
        showSnackbar,
    })

    const handleDeleteCompany = (company) => {
        confirmDelete({
            item: company,
            mutateAsync: deleteRepairCompany.mutateAsync,
            refetch,
            title: "Удалить команию?",
            text: (item) => `Вы действительно хотите удалить компанию ${item.name}?`,
            successText: "Компания удалена!"
        })
    }

    return (
        <>
            <ObjectListView
                title="Ремонтные компании"
                items={repairCompanies}
                loading={isPending || deleteRepairCompany.isPending}
                error={error}
                onRetry={refetch}
                addTo="/repair/companies/create"
                renderRow={(company) => (
                    <ObjectListViewRow
                        title={company.name}
                        subtitle={company.organization}
                        address={company.address}
                        email={company.email}
                        phone={company.phone}
                        to={`/repair-companies/${company.id}`}
                        onDelete={() => handleDeleteCompany(company)}
                    />
                )}
            />

            <ConfirmDialog
                open={confirm.open}
                title={confirm.title}
                text={confirm.text}
                confirmText={confirm.confirmText}
                cancelText={confirm.cancelText}
                confirmColor={confirm.confirmColor}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
            />

            <AppSnackbar open={snack.open} message={snack.message} severity={snack.severity} onClose={closeSnackbar} />
        </>
    )
}