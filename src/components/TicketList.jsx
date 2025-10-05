import React, { useEffect, useState } from "react";
// Assuming this path is correct for your setup.
import axiosInstance from "../api/axiosInstance"; 
import { AlertTriangle, Clock, MessageSquare } from "lucide-react";

// Helper function to format the date
const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
};

const TicketList = ({ activeStatus, onSelectTicket, selectedTicket, search }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTickets = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch all tickets. Filtering by status is done client-side for simplicity.
            const res = await axiosInstance.get("/tickets");
            
            let fetchedData = res.data;

            // Defensive check for common API response wrappers
            if (fetchedData && fetchedData.data && Array.isArray(fetchedData.data)) {
                fetchedData = fetchedData.data;
            }

            if (!Array.isArray(fetchedData)) {
                console.warn("API response for /tickets was not an array:", res.data);
                fetchedData = [];
            }

            let filtered = fetchedData;
            
            // 1. Filter by Status
            if (activeStatus !== "all") {
                filtered = filtered.filter((t) => t.status.toLowerCase() === activeStatus.toLowerCase());
            }

            // 2. Filter by Search
            if (search) {
                const lowerSearch = search.toLowerCase();
                filtered = filtered.filter((t) =>
                    t.title.toLowerCase().includes(lowerSearch) || 
                    t._id.includes(lowerSearch) // Allow searching by ID
                );
            }

            setTickets(filtered);
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
            setError("Failed to load tickets. Check your network or API endpoint.");
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Re-fetch tickets whenever the status filter or search term changes
    useEffect(() => {
        fetchTickets();
        // Since we are filtering client-side for search, we should pass 'search' as a prop
        // and add it to the dependency array of the parent component's useEffect,
        // but for this component, we rely only on the 'activeStatus' prop.
    }, [activeStatus]); 

    // Helper to determine status color
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'closed': return 'text-green-600 bg-green-100';
            case 'resolved': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full text-gray-500">
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Loading tickets...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-600 bg-red-50 border border-red-200 m-4 rounded-lg">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                {error}
            </div>
        );
    }


    return (
        <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
                <p className="p-4 text-gray-500 text-center text-sm mt-4">No tickets found for status "{activeStatus}".</p>
            ) : (
                tickets.map((ticket) => (
                    <div
                        key={ticket._id}
                        onClick={() => onSelectTicket(ticket)}
                        className={`p-3 border-b border-gray-100 cursor-pointer transition duration-150 ease-in-out 
                            ${selectedTicket?._id === ticket._id 
                                ? "bg-indigo-50 border-r-4 border-indigo-500" 
                                : "hover:bg-gray-50"
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            {/* Ticket Title */}
                            <h4 className="font-medium text-gray-800 truncate pr-2">
                                {ticket.title || `Ticket ID: ${ticket._id.substring(0, 8)}`}
                            </h4>
                            
                            {/* Status Badge */}
                            <span 
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${getStatusColor(ticket.status || 'default')}`}
                            >
                                {ticket.status || 'N/A'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            {/* User ID / Created Time */}
                            <p className="truncate">
                                User: {ticket.userId ? ticket.userId.substring(0, 8) : 'Unknown'}
                            </p>
                            <div className="flex items-center space-x-2">
                                {/* Last Update Time */}
                                <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                                </span>
                                {/* Comment Count (assuming comments array exists) */}
                                <span className="flex items-center">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    {(ticket.comments || []).length}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default TicketList;
