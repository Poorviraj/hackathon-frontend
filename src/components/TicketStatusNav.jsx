import React, { useState, useEffect, useMemo } from 'react';
// FIX: Reverting the path to '../../' as '../' failed for this file. 
// This implies the file structure is deeper than originally assumed.
import axiosInstance from "../api/axiosInstance"; 
import { useAuth } from '../context/AuthContext'; 
import { AlertCircle, Hourglass, CheckCircle, Lock, List } from 'lucide-react';

/**
 * Defines the static list of available ticket statuses and their display properties.
 */
const STATUS_OPTIONS = [
    { name: 'All Tickets', status: 'all', Icon: List, color: 'text-white' },
    { name: 'Open', status: 'Open', Icon: AlertCircle, color: 'text-red-400' },
    { name: 'In Progress', status: 'In Progress', Icon: Hourglass, color: 'text-blue-400' },
    { name: 'Resolved', status: 'Resolved', Icon: CheckCircle, color: 'text-green-400' },
    { name: 'Closed', status: 'Closed', Icon: Lock, color: 'text-gray-400' },
];

/**
 * TicketStatusNav component renders the dark-themed side navigation with ticket status counts.
 * It fetches the full ticket list to calculate the counts locally.
 *
 * @param {function} onStatusSelect - Handler function to be called when a status link is clicked (to filter the main list).
 * @param {string} currentFilter - The currently active status filter.
 */
const TicketStatusNav = ({ onStatusSelect, currentFilter }) => {
    const { user } = useAuth();
    const [counts, setCounts] = useState({ all: 0, Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all tickets and calculate counts
    const fetchTicketCounts = async () => {
        if (!user || !user.id) {
            setError("User is not authenticated. Cannot fetch ticket data.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Fetch all tickets to aggregate counts on the client side
            // In a production environment, a dedicated /tickets/counts endpoint would be preferred
            // We use the same /tickets endpoint used in the main list to fetch all relevant tickets for the user/agent/admin
            const url = '/tickets?limit=1000'; // Set a high limit to try and fetch all tickets
            const response = await axiosInstance.get(url);
            
            const tickets = response.data.data || []; // Note: Accessing response.data.data based on your backend structure
            
            // Calculate counts
            const newCounts = { all: tickets.length };
            // Ensure all STATUS_OPTIONS statuses are initialized to 0
            STATUS_OPTIONS.slice(1).forEach(opt => newCounts[opt.status] = 0); 

            tickets.forEach(ticket => {
                const status = ticket.status;
                if (status && newCounts.hasOwnProperty(status)) {
                    newCounts[status] += 1;
                }
            });
            
            setCounts(newCounts);
        } catch (err) {
            console.error("Error fetching ticket counts:", err);
            setError("Failed to load ticket counts.");
        } finally {
            setLoading(false);
        }
    };

    // Run fetch on mount (and potentially when user object changes, though token change isn't tracked here)
    useEffect(() => {
        // Only run if user is ready (assuming user object will stabilize after login)
        if (user && user.id) {
            fetchTicketCounts();
            // Optionally, implement polling or a subscription here for real-time updates
        }
    }, [user]);

    // Render logic for a single navigation item
    const NavItem = ({ item }) => {
        const isActive = currentFilter === item.status;
        const count = counts[item.status] || 0;

        return (
            <button
                key={item.status}
                onClick={() => onStatusSelect(item.status)}
                className={`flex items-center justify-between w-full p-3 rounded-xl transition duration-150 ease-in-out 
                    ${isActive 
                        ? 'bg-indigo-700 shadow-lg text-white font-bold' 
                        : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                    }`}
                disabled={loading}
            >
                <div className="flex items-center space-x-3">
                    <item.Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-semibold">{item.name}</span>
                </div>
                {loading ? (
                    <div className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <span className={`px-2 py-0.5 text-xs font-extrabold rounded-full min-w-[28px] text-center
                        ${isActive ? 'bg-indigo-500 text-white' : 'bg-indigo-800 text-indigo-200'}`
                    }>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <nav className="p-4 space-y-2 bg-indigo-900 h-full rounded-xl shadow-2xl">
            <h2 className="text-xl font-extrabold text-indigo-50 p-2 border-b border-indigo-800 mb-4">
                Ticket Queue
            </h2>
            {error && (
                <div className="p-2 text-sm text-red-300 bg-indigo-800 rounded-lg flex items-center">
                    {error}
                </div>
            )}
            
            {STATUS_OPTIONS.map(item => (
                <NavItem key={item.status} item={item} />
            ))}
        </nav>
    );
};

export default TicketStatusNav;
