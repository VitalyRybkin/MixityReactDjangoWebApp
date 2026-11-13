import { useEffect, useRef, useState } from 'react'

import { createEmptyRequestForm } from '../utils/request.form.constants.js'

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
    // Hydrate each repair request only once. Refetches must not overwrite edits.
    const initializedRequestIdRef = useRef(null)
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

        const requestId = String(repairRequest.id)
        if (initializedRequestIdRef.current === requestId) {
            return
        }

        const mappedForm = {
            ...createEmptyRequestForm(),

            id: repairRequest.id,
            request_date: repairRequest.request_date ?? '',
            closing_date: repairRequest.closing_date ?? '',
            status: repairRequest.status ?? 'open',
            location: repairRequest.location ?? 'site',
            repair_company: repairRequest.repair_company ?? '',
            customerId: repairRequest.construction_object?.customer ?? '',
            construction_object: repairRequest.construction_object?.id ?? '',
            description: repairRequest.description ?? '',
            inspection_description: repairRequest.inspection_description ?? '',
            closing_description: repairRequest.closing_description ?? '',
        }

        const mappedSpecifications = normalizeSpecifications(repairRequest.specifications ?? [])

        // A new request gets its own initial snapshot. A background refresh
        // of the same request must preserve its form, specifications and dirty state.
        initializedRequestIdRef.current = requestId
        setForm(mappedForm)
        setSpecifications(mappedSpecifications)

        setInitialSnapshot(
            JSON.stringify({
                form: mappedForm,
                specifications: mappedSpecifications,
            }),
        )

        setIsInitialized(true)
    }, [isEdit, repairRequest, normalizeSpecifications, setForm, setSpecifications])

    useEffect(() => {
        if (isEdit || isLoadingPage || pageLoadError || initialSnapshot !== null) {
            return
        }

        setInitialSnapshot(
            JSON.stringify({
                form,
                specifications,
            }),
        )

        setIsInitialized(true)
    }, [isEdit, isLoadingPage, pageLoadError, initialSnapshot, form, specifications])

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
