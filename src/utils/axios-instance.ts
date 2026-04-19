import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080',
    timeout: 10000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
    async (config) => {
        const session: any = await getSession();
        if (session && session.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling global errors and token refresh
axiosInstance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        // If error is not 401 or request already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            const res = error.response;
            if (res) {
                console.error(`API Error: ${res.status} - ${res.data?.message || error.message}`);
            }
            return Promise.reject(error);
        }

        // If already refreshing, queue the request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            }).catch((err) => {
                return Promise.reject(err);
            });
        }

        // Mark as refreshing
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Force NextAuth session refresh by calling getSession
            // This will trigger the JWT callback which will refresh the token if expired
            const updatedSession: any = await getSession();
            
            if (!updatedSession || !updatedSession.access_token) {
                // Session refresh failed, logout user
                processQueue(new Error('Session refresh failed'), null);
                await signOut({ redirect: false });
                window.location.href = '/login';
                return Promise.reject(new Error('Session refresh failed'));
            }

            const newAccessToken = updatedSession.access_token;

            // Process queued requests with new token
            processQueue(null, newAccessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            // Refresh error, logout user
            console.error('Session refresh error:', refreshError);
            processQueue(refreshError, null);
            await signOut({ redirect: false });
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;
