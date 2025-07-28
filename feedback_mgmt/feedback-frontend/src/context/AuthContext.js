import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authTokens, setAuthTokens] = useState(() => {
        const tokens = localStorage.getItem('authTokens');
        return tokens ? JSON.parse(tokens) : null;
    });

    useEffect(() => {
        if (authTokens) {
            const decoded = jwtDecode(authTokens.access);
            // For example, your token contains username and role in payload
            setUser({
                username: decoded.username,
                role: decoded.role,
                isSuperuser: decoded.is_superuser, // if your token has this field
                // optionally add is_superuser: decoded.is_superuser if encoded
            });
        } else {
            setUser(null);
        }
    }, [authTokens]);

    const loginUser = async (username, password) => {
        try {
            const response = await axiosInstance.post('/auth/token/', {
                username,
                password,
            });
            setAuthTokens(response.data);
            localStorage.setItem('authTokens', JSON.stringify(response.data));
            const decoded = jwtDecode(response.data.access);
            setUser({
                username: decoded.username,
                role: decoded.role,
                isSuperuser: decoded.is_superuser, // if your token has this field
            });
            return true;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    };

    const logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
    };

    return (
        <AuthContext.Provider value={{ user, authTokens, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };