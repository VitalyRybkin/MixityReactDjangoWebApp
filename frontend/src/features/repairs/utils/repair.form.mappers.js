export const getRepairRelationId = (value) => {
    const id = value && typeof value === 'object' ? value.id : value
    return id == null || id === '' ? null : id
}

const sameRelationId = (first, second) =>
    first === second || (first != null && second != null && String(first) === String(second))

// null means propose the customer's active contract; an explicit empty string
// prevents automatic selection (important for editing legacy repairs).
export const resolveRentalContractSelection = (form, customerContracts = []) => {
    if (form.rental_contract !== null && form.rental_contract !== undefined) {
        const id = getRepairRelationId(form.rental_contract)
        return id == null ? '' : String(id)
    }
    if (!form.customerId) return ''
    const active = customerContracts.find((contract) => contract.is_active)
    return active ? String(active.id) : ''
}

export const toRepairRequestPayload = (form, specifications, originalRequest = null, selectedContractId = form.rental_contract) => {
    const payload = {
        request_date: form.request_date,
        closing_date: form.closing_date || null,
        status: form.status,
        location: form.location,
        repair_company: getRepairRelationId(form.repair_company),
        construction_object: getRepairRelationId(form.construction_object),
        rental_contract: getRepairRelationId(selectedContractId),
        is_after_return: form.location === 'workshop' && Boolean(form.is_after_return),
        description: form.description,
        inspection_description: form.inspection_description,
        closing_description: form.closing_description,
        specifications,
    }

    if (originalRequest) {
        // PATCH must not revalidate unchanged historical relations against active-only choices.
        for (const field of ['repair_company', 'construction_object', 'rental_contract']) {
            if (sameRelationId(payload[field], getRepairRelationId(originalRequest[field]))) {
                delete payload[field]
            }
        }
    }

    return payload
}

export const withCurrentRepairOption = (options = [], value, original, label) => {
    const id = getRepairRelationId(value)
    if (id == null) return options

    const selectedOption = options.find((option) => sameRelationId(option.id, id))
    if (selectedOption) {
        // AppSelectField compares IDs strictly, including their type.
        return selectedOption.id === id
            ? options
            : options.map((option) => (option === selectedOption ? { ...option, id } : option))
    }

    if (!sameRelationId(id, getRepairRelationId(original))) return options

    return [
        ...options,
        {
            ...(original && typeof original === 'object' ? original : {}),
            id,
            name: original?.name || `${label} № ${id}`,
        },
    ]
}
