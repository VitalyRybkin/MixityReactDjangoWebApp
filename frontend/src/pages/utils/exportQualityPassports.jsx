import api from '../../api.js'
import { exportQualityPassport } from '../../features/catalog/utils/exportQualityPassport.jsx'

const passportIdFromItem = (item) => {
    const value = item?.quality_passport
    const candidate = typeof value === 'object' && value !== null ? value.id : value
    const id = Number(candidate)
    return candidate != null && Number.isSafeInteger(id) && id > 0 ? id : null
}

export function collectQualityPassportIds(orders) {
    const ids = new Set()

    for (const order of orders ?? []) {
        const items = order.order_products ?? order.order_items ?? order.products ?? []
        for (const item of Array.isArray(items) ? items : []) {
            const id = passportIdFromItem(item)
            if (id != null) ids.add(id)
        }
    }

    return [...ids]
}

/**
 * Download each passport attached to exported order items exactly once.
 * Uses the existing catalog PDF template (including product name/date in filename).
 * IMPORTANT: do not select the latest passport for a product: older orders can
 * be attached to historical passport IDs.
 */
export async function prepareQualityPassportFiles(orders) {
    const ids = collectQualityPassportIds(orders)
    const passports = []
    for (const id of ids) {
        const { data } = await api.get(`/api/catalog/quality-passports/${id}/`)

        if (Number(data?.id) !== id || !Array.isArray(data?.specifications)) {
            throw new Error(`Не удалось загрузить полные данные паспорта качества ${id}`)
        }

        passports.push(data)
    }

    const files = []
    for (const passport of passports) {
        files.push(await exportQualityPassport(passport, { mode: 'file' }))
    }
    return files
}

// export async function exportQualityPassports(orders) {
//     const files = await prepareQualityPassportFiles(orders)
//     for (const file of files) {
//         const url = URL.createObjectURL(file.blob)
//         const link = document.createElement('a')
//         link.href = url
//         link.download = file.filename
//         document.body.appendChild(link)
//         try {
//             link.click()
//         } finally {
//             link.remove()
//             setTimeout(() => URL.revokeObjectURL(url), 60_000)
//         }
//     }
//     return files.length
// }
