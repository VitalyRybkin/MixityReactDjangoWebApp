import { Divider, Typography } from '@mui/material'

import AppSidebar from '../../../layouts/AppSidebar.jsx'

export default function OrderDetailSideBar({ open, setOpen, customerPrices }) {
    console.log('customerPrices', customerPrices?.product?.name)
    return (
        <AppSidebar open={open} setOpen={setOpen}>
            <Typography variant="h6" sx={{ mt: 3 }}>
                Данные заявки
            </Typography>

            <Divider sx={{ my: 2, mb: 0 }} />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {customerPrices.map((item) => {
                    return `${item.product.name} - ${item.sale_price}`
                })}
            </Typography>

            <Divider sx={{ my: 2, mb: 0 }} />
            <Divider sx={{ my: 2, mb: 0 }} />
            <Divider sx={{ my: 2, mb: 1 }} />
        </AppSidebar>
    )
}
