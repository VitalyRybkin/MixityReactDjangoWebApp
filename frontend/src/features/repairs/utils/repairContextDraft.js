import { changeRepairContext, getRepairRelationId } from './repair.form.mappers.js'

// Preserve only the rental-related fields, using their original representations.
// In particular, null rental_contract retains the existing auto-selection logic.
const pickRentalContext = (form) => ({
    customerId: form.customerId,
    construction_object: form.construction_object,
    rental_contract: form.rental_contract,
})

const isRentalMode = (form) =>
    form.location === 'site' || (form.location === 'workshop' && Boolean(form.is_after_return))

const hasRentalFields = (form) =>
    Boolean(form.customerId) ||
    getRepairRelationId(form.construction_object) != null ||
    getRepairRelationId(form.rental_contract) != null

// A pure transition function: the caller owns the temporary in-memory draft.
// No draft values are used while the form is regulatory (workshop, no return).
export const transitionRepairContextWithDraft = (previous, field, value, draft = null) => {
    const next = changeRepairContext(previous, field, value)
    if (field !== 'location' && field !== 'is_after_return') {
        return { form: next, draft }
    }

    // Remember the latest rental selection, including deliberate empty values.
    // Also cover historical workshop requests that still have linked relations.
    const remembered = isRentalMode(previous) || hasRentalFields(previous)
        ? pickRentalContext(previous)
        : draft

    return {
        form: isRentalMode(next) && remembered ? { ...next, ...remembered } : next,
        draft: remembered,
    }
}
