import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export function formatFilteringDate(dateStr, includeYear = false) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    if (includeYear) {
        return `${day}.${month}.${year}`
    }
    return `${day}.${month}`
}

export async function exportOrdersToExcel(orders, filters, warehouses) {
    const jsonData = Array.isArray(orders) ? orders : Array.isArray(orders?.results) ? orders.results : []

    if (!jsonData.length) {
        throw new Error('NO_DATA')
    }

    const flattenedData = jsonData.flatMap((order) => {
        const products = order.order_products ?? order.products ?? order.order_items ?? []

        let baseRow = {
            'Номер': order.id ?? '',
            'Дата доставки': formatFilteringDate(order.delivery_date ?? '', true) ?? '',
            'Организация': order.client ?? '-',
            'Склад': order.warehouse ?? '-',
            'Водитель': order.driver ?? '-',
            'Образцы': order.samples ? '+' : '',
            'Примечание': order.description ?? '',
        }

        if (!products.length) {
            return [
                {
                    ...baseRow,
                    'Наименование': 'Нет товаров',
                    'Кол-во': 0,
                    'Ед.': '-',
                    'Вес уп. (кг)': '-',
                    'Всего (кг)': '-',
                    'Водитель': '-',
                    'Упаковка': '-',
                    'Примечание': order.description ?? '',
                    isEmpty: true,
                },
            ]
        }

        return products.map((item) => {
            const factor =
                (item.product?.product_unit?.unit?.to_kg_factor ?? 0) * (item.product?.product_unit?.value ?? 0)
            const qty = Number(item.piece_based_quantity ?? item.weight_quantity ?? 0)

            return {
                ...baseRow,
                'Наименование': item.product?.name ?? '-',
                'Кол-во': qty,
                'Ед.': item.product?.product_unit?.unit?.display_name ?? '-',
                'Вес уп. (кг)': factor || '-',
                'Всего (кг)': qty && factor ? qty * factor : '-',
                'Водитель': order.driver ?? '-',
                'Упаковка': item.pack_type?.name ?? '-',
                isEmpty: false,
            }
        })
    })

    const excelColumns = [
        'Номер',
        'Дата доставки',
        'Организация',
        'Склад',
        'Наименование',
        'Кол-во',
        'Ед.',
        'Вес уп. (кг)',
        'Всего (кг)',
        'Водитель',
        'Упаковка',
        'Образцы',
        'Примечание',
    ]

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Заявки')

    worksheet.columns = excelColumns.map((key) => ({
        header: key,
        key,
        width: Math.max(key.length, ...flattenedData.map((row) => String(row[key] ?? '').length)) + 3,
        style: { alignment: { horizontal: 'left' } },
    }))

    const numberCols = ['Кол-во', 'Вес уп. (кг)', 'Всего (кг)']

    worksheet.columns.forEach((col) => {
        if (numberCols.includes(col.header)) {
            col.style = {
                ...col.style,
                alignment: { horizontal: 'right' },
                // numFmt: '#,##0.00',
            }
        }
    })

    worksheet.addRows(flattenedData)

    const mergeColumns = ['Номер', 'Дата доставки', 'Организация', 'Склад', 'Водитель', 'Примечание']

    let rowIndex = 2
    for (const order of jsonData) {
        const products = order.order_products ?? order.products ?? order.order_items ?? []
        const productCount = Math.max(products.length, 1)

        if (productCount > 1) {
            for (const colKey of mergeColumns) {
                const colNumber = worksheet.getColumn(colKey).number
                worksheet.mergeCells(rowIndex, colNumber, rowIndex + productCount - 1, colNumber)

                worksheet.getCell(rowIndex, colNumber).alignment = {
                    horizontal: 'left',
                    vertical: 'middle',
                }
            }
        }

        rowIndex += productCount
    }

    worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF000000' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5EFEB' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    worksheet.eachRow((row, rowNumber) => {
        const sourceRow = flattenedData[rowNumber - 2]
        const isEmptyRow = rowNumber !== 1 && sourceRow?.isEmpty

        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            }

            if (isEmptyRow) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5E5' } }
                cell.font = { italic: true, color: { argb: 'FFB71C1C' } }
            }
        })
    })

    worksheet.autoFilter = {
        from: { row: 1, column: 2 },
        to: { row: worksheet.rowCount, column: 5 },
    }

    const buffer = await workbook.xlsx.writeBuffer()

    const startPeriod = formatFilteringDate(filters.dateFrom, false)
    const endPeriod = formatFilteringDate(filters.dateTo, true)
    const dateStr = filters.dateFrom === filters.dateTo ? endPeriod : `${startPeriod}-${endPeriod}`

    const warehouseName = filters.warehouseId
        ? (warehouses.find((w) => w.id === filters.warehouseId)?.name ?? 'unknown')
        : null

    const warehouseStr = warehouseName ? `_склад_${warehouseName}` : '_ВСЕ_СКЛАДЫ'

    saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `заявки${warehouseStr}_${dateStr}.xlsx`,
    )
}
