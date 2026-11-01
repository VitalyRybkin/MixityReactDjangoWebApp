
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export function formatFilteringDate(dateStr, includeYear = false) {
    if (!dateStr) return ''

    const [year, month, day] = dateStr.split('-')

    return includeYear
        ? `${day}.${month}.${year}`
        : `${day}.${month}`
}

const STATUS_LABELS = {
    open: 'Открыта',
    closed: 'Закрыта',
}

const LOCATION_LABELS = {
    site: 'На объекте',
    workshop: 'В мастерской',
}

export async function exportRequestsToExcel(requests, filters = {}) {
    const jsonData = Array.isArray(requests)
        ? requests
        : Array.isArray(requests?.results)
            ? requests.results
            : []

    if (!jsonData.length) {
        throw new Error('NO_DATA')
    }

    const rows = jsonData.map((request) => ({
        'Номер': request.id ?? '',
        'Дата заявки': formatFilteringDate(request.request_date, true),
        'Дата закрытия': formatFilteringDate(request.closing_date, true),
        'Заказчик': request.customer ?? '',
        'Объект': request.construction_object ?? '',
        'Адрес объекта': request.construction_object_address ?? '',
        'Ремонтирующая организация': request.repair_company ?? '',
        'Сумма заявки': request.request_sum != null
            ? Number(request.request_sum)
            : null,
        'Статус': STATUS_LABELS[request.status] ?? request.status ?? '',
        'Место ремонта': LOCATION_LABELS[request.location] ?? request.location ?? '',
        'Запрос на ремонт': request.description ?? '',
        'Результат выезда': request.inspection_description ?? '',
        'Закрытие заявки': request.closing_description ?? '',
    }))

    const columns = [
        'Номер',
        'Дата заявки',
        'Дата закрытия',
        'Заказчик',
        'Объект',
        'Адрес объекта',
        'Ремонтирующая организация',
        'Сумма заявки',
        'Статус',
        'Место ремонта',
        'Запрос на ремонт',
        'Результат выезда',
        'Закрытие заявки',
    ]

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Заявки на ремонт')

    worksheet.columns = columns.map((key) => ({
        header: key,
        key,
        width: Math.min(
            50,
            Math.max(
                14,
                key.length + 3,
                ...rows.map(
                    (row) => String(row[key] ?? '').length + 3,
                ),
            ),
        ),
    }))

    worksheet.addRows(rows)

    worksheet.getColumn('Адрес объекта').width = 35

    worksheet.getColumn('Сумма заявки').width = 18
    worksheet.getColumn('Сумма заявки').numFmt = '#,##0.00'

    worksheet.getRow(1).eachCell((cell) => {
        cell.font = {
            bold: true,
            color: { argb: 'FF000000' },
        }
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5EFEB' },
        }
        cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
        }
    })

    worksheet.eachRow((row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            }

            if (rowNumber > 1) {
                cell.alignment = {
                    horizontal: 'left',
                    vertical: 'top',
                    wrapText: true,
                }
            }
        })
    })

    worksheet.views = [
        { state: 'frozen', ySplit: 1 },
    ]

    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
    }

    const startPeriod = formatFilteringDate(filters.dateFrom)
    const endPeriod = formatFilteringDate(filters.dateTo, true)

    const period = filters.dateFrom && filters.dateTo
        ? filters.dateFrom === filters.dateTo
            ? endPeriod
            : `${startPeriod}-${endPeriod}`
        : formatFilteringDate(
            filters.dateFrom ?? filters.dateTo,
            true,
        )

    const filename = `заявки_на_ремонт${period ? `_${period}` : ''}.xlsx`

    const buffer = await workbook.xlsx.writeBuffer()

    saveAs(
        new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        filename,
    )
}
