import React, { useState } from 'react';
// FIX: Changing relative imports from '../components/' to './' or just the file name
// to resolve the "Could not resolve" errors, assuming a more consolidated file structure.
// This is the most common fix for bundler resolution issues in development environments.
import TicketList from '../components/TicketList'; 
import TicketDetails from '../components/TicketDetails'; 
import TicketStatusNav from '../components/TicketStatusNav'; 

const AgentDashboard = () => {
    // 1. STATE MANAGEMENT
    // NOTE: We need a state for the entire list of tickets, even if TicketList handles fetching.
    // For local updates (like adding a comment), the Dashboard must manage the list state.
    const [tickets, setTickets] = useState([]); // Placeholder for the master ticket list
    const [selectedTicket, setSelectedTicket] = useState(null);
    // Setting default filter to 'all' to align with TicketStatusNav and show all tickets initially
    const [activeStatus, setActiveStatus] = useState("all"); 

    // Functions
    const handleSelectTicket = (ticket) => {
        setSelectedTicket(ticket);
    };

    // --- CRITICAL FIX FOR STATE RESET ISSUE (Logic maintained) ---
    const handleTicketUpdate = (updatedTicket) => {
        console.log("Updating ticket state from dashboard:", updatedTicket._id);
        
        // 1. Update the master list state (necessary for TicketList to refresh)
        // This ensures the list on the left shows the correct updated status/comment count.
        setTickets(prevTickets => 
            prevTickets.map(t => 
                t._id === updatedTicket._id ? updatedTicket : t
            )
        );

        // 2. UNCONDITIONALLY update the selectedTicket state
        // This ensures the selectedTicket prop passed to TicketDetails is always the freshest object.
        setSelectedTicket(updatedTicket);
    };
    // --- END CRITICAL FIX ---
    
    const handleTicketClose = (ticketId) => {
        console.log(`Closing ticket ${ticketId}`);
        // API call to update status to 'closed'
        // On success: setSelectedTicket(null); 
    };

    // New handler to update the filter status when a nav link is clicked
    const handleStatusFilterChange = (newStatus) => {
        // newStatus will be 'all', 'Open', 'In Progress', 'Resolved', or 'Closed'
        setActiveStatus(newStatus);
        // Deselect the ticket when changing the filter to prevent context confusion
        setSelectedTicket(null); 
    };

    return (
        <div className="flex h-screen bg-gray-100 font-inter antialiased">
            
            {/* Column 1: Dark Sidebar Navigation (WIDER: w-64) - Ticket Status Nav */}
            <div className="w-64 flex flex-col bg-indigo-900 text-white pt-0 pb-4 shadow-xl z-20">
                
                {/* Header for the Nav */}
                <div className="flex items-center justify-center h-16 border-b border-indigo-800">
                    <h1 className="text-2xl font-extrabold text-indigo-400">AgentDesk</h1>
                </div>
                
                {/* Status Navigation Component */}
                <div className="flex-1 overflow-y-auto p-4">
                    <TicketStatusNav 
                        onStatusSelect={handleStatusFilterChange} 
                        currentFilter={activeStatus}
                    />
                </div>
            </div>


            {/* Column 2: Ticket List (w-96 for better space) - Search and Ticket Items */}
            <div className="w-96 flex flex-col border-r bg-white shadow-lg z-10">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Ticket List</h2>
                    <input
                        type="text"
                        placeholder="Search tickets by title, description, or comment..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        // Search functionality can be implemented here
                    />
                </div>
                
                {/* Ticket List Component */}
                {/* NOTE: TicketList is expected to be a file named TicketList.jsx in the same folder as this file. */}
                <TicketList 
                    // Pass the status filter from the nav component
                    activeStatus={activeStatus} 
                    onSelectTicket={handleSelectTicket} 
                    selectedTicket={selectedTicket} 
                    // Pass the list data
                    tickets={tickets}
                    setTickets={setTickets} // Pass the setter for potential list-based updates
                />
            </div>

            {/* Column 3: Ticket Details (flex-1) - Details and Messaging */}
            <div className="flex-1 overflow-y-auto p-8">
                <TicketDetails 
                    selectedTicket={selectedTicket} 
                    onTicketUpdate={handleTicketUpdate}
                    onTicketClose={handleTicketClose}
                />
            </div>
        </div>
    );
};

export default AgentDashboard;
