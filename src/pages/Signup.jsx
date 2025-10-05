import React from 'react'
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const Signup = () => {
    // 1. FIX: Initialize 'role' to a valid default value ('user')
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await axiosInstance.post("/auth/signup", form);
            // Log success instead of alert
            console.log("Signup successful!", res.data);
            navigate("/login");
        } catch (err) {
            console.error("Signup error details:", err.response || err);
            // Display error message from backend or a generic 400 validation error
            setError(err.response?.data?.message || err.response?.data?.msg || "Signup failed: Check password length, email format, or ensure the role is valid.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-indigo-600"
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">Signup</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <input
                    name="name"
                    placeholder="Name"
                    className="w-full border p-3 rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    onChange={handleChange}
                    required
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="w-full border p-3 rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    onChange={handleChange}
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="w-full border p-3 rounded-lg mb-6 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    onChange={handleChange}
                    required
                />

                {/* 2. FIX: Bind the value to form.role */}
                <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg mb-6 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-gray-700"
                >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                </select>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing Up...' : 'Signup'}
                </button>
                
                <p className="mt-4 text-center text-sm text-gray-600">
                    Already have an account? 
                    <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 ml-1">
                        Log In
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
