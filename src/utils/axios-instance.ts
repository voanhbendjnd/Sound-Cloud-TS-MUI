import axios from 'axios';
import { getSession } from 'next-auth/react';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080',
    timeout: 10000,
});

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

// Response interceptor for handling global errors
axiosInstance.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const res = error.response;
        if (res) {
            // Handle specific status codes
            console.error(`API Error: ${res.status} - ${res.data?.message || error.message}`);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
