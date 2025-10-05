import React from 'react'
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ activeStatus, setActiveStatus }) => {
    const { logout } = useAuth();
    const statuses = [
        { label: "All Tickets", key: "all" },
        { label: "In Progress", key: "in-progress" },
        { label: "Closed", key: "closed" },
    ];

    return (
        <div className="w-20 bg-indigo-600 text-white flex flex-col items-center py-6 space-y-6">
            {statuses.map((s) => (
                <button
                    key={s.key}
                    onClick={() => setActiveStatus(s.key)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${activeStatus === s.key ? "bg-white text-indigo-600" : "hover:bg-indigo-500"
                        }`}
                    title={s.label}
                >
                    {s.label.charAt(0).toUpperCase()}
                </button>
            ))}
            <button
                onClick={logout}
                className="mt-auto text-sm bg-white text-indigo-600 px-3 py-1 rounded font-semibold hover:bg-indigo-100"
            >
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
