import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080',
    timeout: 300000,
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
            // Check if token is about to expire or already expired
            const tokenExpiryBuffer = 2 * 60 * 1000; // 2 minutes buffer
            const timeUntilExpiry = session.expires_in ? (session.expires_in - Date.now()) : Infinity;
            
            // If token is expired or about to expire, refresh it proactively
            if (timeUntilExpiry <= tokenExpiryBuffer) {
                console.log('Token expiring soon, refreshing proactively...');
                const updatedSession: any = await getSession();
                if (updatedSession && updatedSession.access_token) {
                    config.headers.Authorization = `Bearer ${updatedSession.access_token}`;
                } else {
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }
            } else {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
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
                window.location.href = '/auth/signin';
                return Promise.reject(new Error('Session refresh failed'));
            }

            // Check if refresh token expired (NextAuth sets error when refresh fails)
            if (updatedSession.error === 'RefreshAccessTokenError') {
                // Refresh token expired, logout user
                processQueue(new Error('Refresh token expired'), null);
                await signOut({ redirect: false });
                window.location.href = '/auth/signin';
                return Promise.reject(new Error('Refresh token expired'));
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
            window.location.href = '/auth/signin';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;
