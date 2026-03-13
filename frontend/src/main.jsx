import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

import App from './App'
import ColorModeProvider from './theme/ColorModeProvider'

dayjs.locale('ru')

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ColorModeProvider>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                        <App />
                    </LocalizationProvider>
                </QueryClientProvider>
            </BrowserRouter>
        </ColorModeProvider>
    </React.StrictMode>,
)
