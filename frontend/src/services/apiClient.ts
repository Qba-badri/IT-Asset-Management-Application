import axios from 'axios';
import { getErrorMessage, getFieldErrors, isValidationError } from '../lib/validationErrors';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
export { API_URL };

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to request headers if it exists
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        // Normalize validation failures onto the error object. `friendlyMessage`
        // is safe for any call site to render directly; `fieldErrors` lets forms
        // map messages back onto the fields that caused them.
        if (isValidationError(error)) {
            error.fieldErrors = getFieldErrors(error);
        }
        error.friendlyMessage = getErrorMessage(error, 'Something went wrong.');

        return Promise.reject(error);
    }
);

export default apiClient;
