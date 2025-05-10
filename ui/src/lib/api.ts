const BASE_URL = 'http://localhost:8080';

export function login() {
    window.location.href = `${BASE_URL}/api/v1/auth/login`
}