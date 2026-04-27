import * as React from 'react'

import TablePagination from '@mui/material/TablePagination'
import {
    gridPageCountSelector,
    gridPageSelector,
    gridPaginationModelSelector,
    gridPaginationRowCountSelector,
    useGridApiContext,
    useGridSelector,
} from '@mui/x-data-grid'

function CustomPagination() {
    const apiRef = useGridApiContext()

    const page = useGridSelector(apiRef, gridPageSelector)
    const pageCount = useGridSelector(apiRef, gridPageCountSelector)
    const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector)
    const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector)

    const handlePageChange = (_, newPage) => {
        apiRef.current.setPage(newPage)
    }

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
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count !== -1 ? count : `более ${to}`}`}
            backIconButtonProps={{ disabled: page === 0 }}
            nextIconButtonProps={{ disabled: page >= pageCount - 1 }}
        />
    )
}

export default CustomPagination
