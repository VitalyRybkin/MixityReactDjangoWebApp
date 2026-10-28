import { useEffect, useState } from 'react'

import { emptyRequestForm } from '../utils/request.form.constants.js'

export function useRepairRequestFormData({
                                             isEdit,
                                             repairRequest,
                                             isLoadingPage,
                                             pageLoadError,
                                             form,
                                             specifications,
                                             setForm,
                                             setSpecifications,
                                             normalizeSpecifications,
                                         }) {
    const [initialSnapshot, setInitialSnapshot] = useState(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    useEffect(() => {
        if (!isInitialized || initialSnapshot === null) {
            return
        }

        const currentSnapshot = JSON.stringify({
            form,
            specifications,
        })

        setIsDirty(currentSnapshot !== initialSnapshot)
    }, [form, specifications, initialSnapshot, isInitialized])

    useEffect(() => {
        if (!isEdit || !repairRequest) {
            return
        }

        const mappedForm = {
            ...emptyRequestForm,

            id: repairRequest.id,
            request_date: repairRequest.request_date ?? '',
            closing_date: repairRequest.closing_date ?? '',
            status: repairRequest.status ?? 'open',
            location: repairRequest.location ?? 'site',
            repair_company: repairRequest.repair_company ?? '',
            customerId:
                repairRequest.construction_object?.customer ?? '',
            construction_object:
                repairRequest.construction_object?.id ?? '',
            description: repairRequest.description ?? '',
            closing_description:
                repairRequest.closing_description ?? '',
        }

        const mappedSpecifications = normalizeSpecifications(
            repairRequest.specifications ?? [],
        )

        setForm(mappedForm)
        setSpecifications(mappedSpecifications)

        setInitialSnapshot(
            JSON.stringify({
                form: mappedForm,
                specifications: mappedSpecifications,
            }),
        )

        setIsInitialized(true)
    }, [isEdit, repairRequest]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (
            isEdit ||
            isLoadingPage ||
            pageLoadError ||
            initialSnapshot !== null
        ) {
            return
        }

        setInitialSnapshot(
            JSON.stringify({
                form,
                specifications,
            }),
        )

        setIsInitialized(true)
    }, [
        isEdit,
        isLoadingPage,
        pageLoadError,
        initialSnapshot,
        form,
        specifications,
    ])

    const markClean = () => {
        setInitialSnapshot(
            JSON.stringify({
                form,
                specifications,
            }),
        )

        setIsDirty(false)
    }

    return {
        isDirty,
        markClean,
    }
}