export const clickableDataGridSx = (theme) => {
    const borderColor = theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.14)' : theme.palette.divider

    return {
        bgcolor: 'background.default',
        borderColor,

        '--DataGrid-rowBorderColor': borderColor,

        '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'background.default',
        },

        '& .MuiDataGrid-columnHeader': {
            bgcolor: 'background.default',
        },

        '& .MuiDataGrid-columnSeparator': {
            color: borderColor,
            opacity: 1,
        },

        '& .MuiDataGrid-row': {
            cursor: 'pointer',
        },

        '& .MuiDataGrid-footerContainer': {
            borderTopColor: borderColor,
        },
    }
}
