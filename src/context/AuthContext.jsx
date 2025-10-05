import React,{ createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        // FIX: Check if storedUser is truthy AND is not the literal string "undefined"
        if (storedUser && storedUser !== "undefined") {
            try {
                // Attempt to parse the stored data
                setUser(JSON.parse(storedUser));
            } catch (e) {
                // If parsing fails (e.g., corrupted data), log the error and clear the bad entry
                console.error("Error parsing stored user data. Clearing storage.", e);
                localStorage.removeItem("user");
            }
        }

        setLoading(false);
    }, []);

    // Updated login function to enforce data structure
    const login = (data) => {
        if (!data.token || !data.user || !data.user.role) {
            // Throw an error if the necessary data for login/role determination is absent
            throw new Error("Invalid login response structure: Missing token or user/role data.");
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
