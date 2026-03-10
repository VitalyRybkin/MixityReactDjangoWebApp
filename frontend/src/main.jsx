import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ColorModeProvider from "./theme/ColorModeProvider";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

const queryClient = new QueryClient(
    {defaultOptions: {queries: {retry: 1, refetchOnWindowFocus: false}}}
);

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ColorModeProvider>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </BrowserRouter>
        </ColorModeProvider>
    </React.StrictMode>
);