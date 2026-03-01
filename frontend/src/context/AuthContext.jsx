// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const storedUser = authService.getCurrentUser();
        const token = localStorage.getItem('access_token');

        if (storedUser && token) {
            setUser(storedUser);
            setProfile(storedUser); // In this simplified DRF flow, user and profile are often synced
        }
        setLoading(false);
    }, []);

    const signIn = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            setUser(data.user);
            setProfile(data.user);
            return data;
        } catch (error) {
            console.error('[AuthContext] Login error:', error);
            throw error;
        }
    };

    const signOut = () => {
        authService.logout();
        setUser(null);
        setProfile(null);
    };

    const value = {
        user,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile: () => {
            const storedUser = authService.getCurrentUser();
            setProfile(storedUser);
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
