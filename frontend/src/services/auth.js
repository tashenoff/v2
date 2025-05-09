const API_URL = 'http://localhost:5000/api';

export const login = async (username, password) => {
    console.log('Attempting login for:', username);
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error);
        throw new Error(error.error || 'Ошибка при входе');
    }
    
    const data = await response.json();
    console.log('Login successful, data:', data);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
};

export const register = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при регистрации');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    return data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getToken = () => localStorage.getItem('token');

export const isAuthenticated = () => {
    const token = getToken();
    console.log('Checking authentication, token:', token ? 'exists' : 'not found');
    return !!token;
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    console.log('Getting current user:', user ? JSON.parse(user) : 'no user found');
    return user ? JSON.parse(user) : null;
}; 