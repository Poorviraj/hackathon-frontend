import React from 'react'
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <h1 className="text-5xl font-bold mb-4">Smart Ticketing System 🎫</h1>
            <p className="max-w-lg text-center mb-8 text-gray-200">
                A smart way to manage support tickets, assign them to agents, track SLA breaches, and resolve issues efficiently.
            </p>
            <div className="flex gap-4">
                <Link
                    to="/login"
                    className="bg-white text-indigo-600 px-5 py-2 rounded-lg font-semibold shadow"
                >
                    Login
                </Link>
                <Link
                    to="/signup"
                    className="border border-white px-5 py-2 rounded-lg font-semibold text-white hover:bg-white hover:text-indigo-600"
                >
                    Signup
                </Link>
            </div>
        </div>
    );
};

export default Home;
