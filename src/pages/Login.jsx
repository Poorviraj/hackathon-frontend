import React,{ useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors
        setIsLoading(true);

        try {
            const res = await axiosInstance.post("/auth/login", { email, password });
            const responseData = res.data;

            // This call will throw an error if responseData.user is missing
            login(responseData);

            // Safe Redirection (only runs if login() succeeded)
            const role = responseData.user.role;

            if (role === "admin") navigate("/admin");
            else if (role === "agent") navigate("/agent");
            else navigate("/user");

        } catch (err) {
            console.error("Login Attempt Failed:", err.response || err);

            let errorMessage = "Login failed. Please check credentials.";

            // Check for the specific error thrown by AuthContext
            if (err.message.includes("Invalid login response structure")) {
                // This confirms the backend is sending a successful but incomplete response
                errorMessage = "Login successful, but failed to retrieve user data. Please fix the backend's login response.";
            } else if (err.response) {
                // Error from the backend (e.g., 401 Unauthorized)
                errorMessage = err.response.data.msg || "Invalid Credentials.";
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-indigo-600"
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">Login</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border p-3 rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border p-3 rounded-lg mb-6 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging In...' : 'Login'}
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Don't have an account?
                    <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-800 ml-1">
                        Sign Up
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
