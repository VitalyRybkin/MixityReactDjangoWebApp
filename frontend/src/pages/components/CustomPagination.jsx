/** Supplies Russian pagination controls for the orders data grid. */
import * as React from 'react'

import TablePagination from '@mui/material/TablePagination'
import {
    gridPageSelector,
    gridPaginationModelSelector,
    gridPaginationRowCountSelector,
    useGridApiContext,
    useGridSelector,
} from '@mui/x-data-grid'

// Connects page and page-size controls to the grid's pagination state.
function CustomPagination() {
    const apiRef = useGridApiContext()

    const page = useGridSelector(apiRef, gridPageSelector)
    const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector)
    const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector)

    // Switches the grid to the selected page.
    const handlePageChange = (_, newPage) => {
        apiRef.current.setPage(newPage)
    }

    // Updates how many rows the grid shows per page.
    const handleRowsPerPageChange = (event) => {
        apiRef.current.setPageSize(parseInt(event.target.value, 10))
    }

    return (
        <TablePagination
            component="div"
            count={rowCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={paginationModel.pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Строк на странице:"
            labelDisplayedRows={
                // Formats the visible row range and total in Russian.
                ({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`
            }
        />
    )
}

export default CustomPagination
