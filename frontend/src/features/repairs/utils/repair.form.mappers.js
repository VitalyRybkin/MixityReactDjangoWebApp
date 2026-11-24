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

export const isRegulatoryRepair = (form) =>
    form.location === 'workshop' && !form.is_after_return &&
    !getRepairRelationId(form.construction_object) &&
    !getRepairRelationId(form.rental_contract) &&
    !form.customerId

// Strip only rebilling flags when the user explicitly switches a repair into
// the regulatory mode. Keep parts, services, quantities and prices untouched.
export const clearRebillableOnRegulatorySwitch = (items, previousForm, nextForm) => {
    if (isRegulatoryRepair(previousForm) || !isRegulatoryRepair(nextForm)) return items
    return items.map((item) => (
        item.is_rebillable ? { ...item, is_rebillable: false } : item
    ))
}

export const isLegacyLinkedWorkshop = (originalRequest) =>
    Boolean(
        originalRequest && originalRequest.location === 'workshop' &&
        !originalRequest.is_after_return &&
        (getRepairRelationId(originalRequest.construction_object) ||
            getRepairRelationId(originalRequest.rental_contract)),
    )

// Preserve linked historical workshop repairs until the user explicitly changes
// the location or after-return checkbox. Switching to maintenance clears rentals.
export const changeRepairContext = (previous, field, value) => {
    if (field === 'location') {
        if (value === previous.location) return previous
        return value === 'workshop'
            ? {
                ...previous,
                location: 'workshop',
                is_after_return: false,
                customerId: '',
                construction_object: '',
                rental_contract: '',
            }
            : {
                ...previous,
                location: 'site',
                is_after_return: false,
                customerId: '',
                construction_object: '',
                rental_contract: null,
            }
    }
    if (field === 'is_after_return' && previous.location === 'workshop') {
        if (Boolean(value) === Boolean(previous.is_after_return)) return previous
        return value
            ? {
                ...previous,
                is_after_return: true,
                rental_contract: previous.customerId ? previous.rental_contract : null,
            }
            : {
                ...previous,
                is_after_return: false,
                customerId: '',
                construction_object: '',
                rental_contract: '',
            }
    }
    return { ...previous, [field]: value }
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
