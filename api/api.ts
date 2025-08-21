import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({
    baseURL: 'https://pumplink-backend-production.up.railway.app/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Add interceptors for request/response here if needed
// api.interceptors.request.use(...)
// api.interceptors.response.use(...)

api.interceptors.response.use(
    async (response) => {
        if (response.status === 401) {
            // Handle unauthorized responses
            console.error('Unauthorized access - perhaps you need to log in?');
            await SecureStore.deleteItemAsync('authToken'); // Clear token
            return Promise.reject(new Error('Unauthorized'));
        }
        // Handle successful responses
        return response;
    },
    (error) => {
        // Handle errors
        return Promise.reject(error);
    },
);
