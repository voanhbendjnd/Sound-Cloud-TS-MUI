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
        // 1. Kiểm tra whitelist TRƯỚC khi gọi getSession để tối ưu hiệu năng
        // Dùng so sánh chính xác hoặc regex để tránh trùng lặp giữa /tracks và /tracks/likes
        const publicEndpoints = [
            '/api/v1/search',
            '/api/v1/tracks' // Xóa dấu gạch chéo cuối để khớp chuẩn hơn
        ];

        // Kiểm tra xem URL hiện tại có phải là endpoint công khai hay không
        // Logic: Khớp chính xác hoàn toàn hoặc khớp với đường dẫn gốc của tracks
        const isPublicEndpoint = publicEndpoints.some(endpoint =>
            config.url === endpoint || config.url === `${endpoint}/`
        );

        // 2. Lấy session từ NextAuth
        const session: any = await getSession();

        // 3. Logic gắn Token: CHỈ gắn khi KHÔNG phải endpoint công khai VÀ có token hợp lệ
        if (!isPublicEndpoint && session?.access_token && session.access_token !== "undefined") {

            const tokenExpiryBuffer = 2 * 60 * 1000; // 2 phút
            const timeUntilExpiry = session.expires_in ? (session.expires_in - Date.now()) : Infinity;

            // Nếu token sắp hết hạn, thử lấy session mới nhất (proactive refresh)
            if (timeUntilExpiry <= tokenExpiryBuffer) {
                console.log('Token expiring soon, refreshing proactively...');
                const updatedSession: any = await getSession();

                if (updatedSession?.access_token && updatedSession.access_token !== "undefined") {
                    config.headers.Authorization = `Bearer ${updatedSession.access_token}`;
                } else {
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }
            } else {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } else {
            // QUAN TRỌNG: Xóa header Authorization nếu là Public hoặc không có Token
            // Điều này ngăn chặn lỗi "Malformed token" do gửi "Bearer undefined" lên Spring Boot
            delete config.headers.Authorization;
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

        // Nếu không phải lỗi 401 hoặc request đã thử lại rồi thì trả về lỗi luôn
        if (error.response?.status !== 401 || originalRequest._retry) {
            const res = error.response;
            if (res) {
                console.error(`API Error: ${res.status} - ${res.data?.message || error.message}`);
            }
            return Promise.reject(error);
        }

        // Nếu đang trong quá trình refresh token, đưa request vào hàng đợi
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

        // Đánh dấu đang refresh để các request sau không gọi refresh trùng lặp
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // NextAuth sẽ tự động gọi JWT callback để refresh token khi getSession được gọi
            const updatedSession: any = await getSession();

            if (!updatedSession || !updatedSession.access_token || updatedSession.access_token === "undefined") {
                processQueue(new Error('Session refresh failed'), null);
                await signOut({ redirect: false });
                window.location.href = '/auth/signin';
                return Promise.reject(new Error('Session refresh failed'));
            }

            // Kiểm tra lỗi đặc biệt từ NextAuth refresh strategy
            if (updatedSession.error === 'RefreshAccessTokenError') {
                processQueue(new Error('Refresh token expired'), null);
                await signOut({ redirect: false });
                window.location.href = '/auth/signin';
                return Promise.reject(new Error('Refresh token expired'));
            }

            const newAccessToken = updatedSession.access_token;

            // Giải phóng hàng đợi với token mới
            processQueue(null, newAccessToken);

            // Thực hiện lại request ban đầu với token mới
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
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