import axios from "axios";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "./constants.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, newAccessToken) {
    refreshQueue.forEach(({resolve, reject}) => {
        if (error) reject(error);
        else resolve(newAccessToken);
    });
    refreshQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If no response (network error), just throw
        if (!error.response) return Promise.reject(error);

        // Only handle 401
        if (error.response.status !== 401) return Promise.reject(error);

        // Avoid infinite loop: if refresh itself 401s, bail
        if (originalRequest.url?.includes("/api/auth/token/refresh/")) {
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            window.location.href = "/login";
            return Promise.reject(error);
        }

        // Prevent retry loop
        if (originalRequest._retry) return Promise.reject(error);
        originalRequest._retry = true;

        const refresh = localStorage.getItem(REFRESH_TOKEN);
        if (!refresh) {
            localStorage.removeItem(ACCESS_TOKEN);
            window.location.href = "/login";
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Wait for ongoing refresh
            return new Promise((resolve, reject) => {
                refreshQueue.push({
                    resolve: (newToken) => {
                        originalRequest.headers = originalRequest.headers ?? {};
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    },
                    reject,
                });
            });
        }

        isRefreshing = true;

        try {
            const res = await api.post("/api/auth/token/refresh/", {refresh});
            const newAccess = res.data.access;

            localStorage.setItem(ACCESS_TOKEN, newAccess);
            processQueue(null, newAccess);

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
        } catch (refreshErr) {
            processQueue(refreshErr, null);
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            window.location.href = "/login";
            return Promise.reject(refreshErr);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;