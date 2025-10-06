import React, { useState, useEffect } from 'react';
// FIX: Updating path for axiosInstance to assume a flatter structure (e.g., in the root or a direct sibling)
import axiosInstance from "../api/axiosInstance"; 
// FIX: Updating path for UserTicketDetails to assume a flatter structure (e.g., in the root or a direct sibling)
import UserTicketDetails from '../components/UserTicketDetails'; // Import the new component
import { PlusCircle, Loader2 } from 'lucide-react'; // For icons

/**
 * UserDashboard Component: Main interface for the client user.
 * Displays a list of their tickets and allows creating new tickets or viewing details and chat.
 */
const UserDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", priority: "Low" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // For custom success/error message display

    // Fetch user’s tickets
    const fetchTickets = async () => {
        try {
            const res = await axiosInstance.get("/tickets");
            // Assuming the ticket list comes back in res.data.data
            setTickets(res.data.data || res.data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setStatusMessage({ type: 'error', text: 'Failed to load tickets.' });
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Handle create ticket
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        try {
            const res = await axiosInstance.post("/tickets", form);
            
            // Show custom success message instead of alert
            setStatusMessage({ type: 'success', text: 'Ticket created successfully! We will get back to you shortly.' });
            
            setForm({ title: "", description: "", priority: "Low" });
            fetchTickets();
            
            // Automatically select the new ticket to see details/chat
            setSelectedTicket(res.data.ticket); 
        } catch (error) {
            console.error("Error creating ticket:", error);
            setStatusMessage({ type: 'error', text: error.response?.data?.message || "Error creating ticket." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Placeholder for ticket updates (needed for the UserTicketDetails component props)
    const handleTicketUpdate = (updatedTicket) => {
        // Here you would integrate logic to update the ticket list state if a status changes, etc.
        console.log("Ticket updated in UserDashboard:", updatedTicket);
        // Refresh the list to reflect changes
        fetchTickets(); 
    };

    // Placeholder for closing the ticket (user might be able to close it if resolved)
    const handleTicketClose = (ticketId) => {
        console.log(`User wants to close ticket ${ticketId}`);
        // Implement API call to close ticket if needed
    };

    // Render the New Ticket Form
    const renderNewTicketForm = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-indigo-100">
            <h2 className="text-3xl font-extrabold text-indigo-700 mb-6">Submit New Request</h2>
            <form onSubmit={handleCreateTicket} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Brief Summary)</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="e.g., Unable to log in to my account"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                    <textarea
                        rows="5"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                        placeholder="Please describe the issue in detail, including steps to reproduce."
                        required
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base focus:ring-indigo-500 focus:border-indigo-500 transition"
                    >
                        <option value="Low">Low - General query</option>
                        <option value="Medium">Medium - Minor issue affecting workflow</option>
                        <option value="High">High - Major bug/service disruption</option>
                        <option value="Urgent">Urgent - System down/Critical business impact</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:bg-indigo-300"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <PlusCircle className="w-5 h-5 mr-2" />
                    )}
                    {isSubmitting ? 'Submitting...' : 'Create Ticket'}
                </button>
            </form>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 font-inter antialiased">
            
            {/* Column 1: Ticket List Panel */}
            <div className="w-[380px] flex flex-col bg-white border-r border-gray-200 shadow-xl z-10">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white sticky top-0 z-10">
                    <h2 className="text-2xl font-extrabold">My Support Requests</h2>
                    <button
                        onClick={() => setSelectedTicket(null)}
                        className="flex items-center text-sm font-semibold bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-full transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4 mr-1" /> New
                    </button>
                </div>

                {/* Custom Status Message Banner */}
                {statusMessage && (
                    <div 
                        className={`p-3 text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        onClick={() => setStatusMessage(null)}
                    >
                        {statusMessage.text}
                    </div>
                )}

                {/* Ticket List */}
                <div className="flex-1 overflow-y-auto">
                    {tickets.length === 0 ? (
                        <p className="p-8 text-gray-500 text-center">No requests submitted yet.</p>
                    ) : (
                        tickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition duration-150 ease-in-out
                                    hover:bg-indigo-50 ${selectedTicket?._id === ticket._id ? "bg-indigo-100 border-l-4 border-indigo-600" : ""
                                }`}
                            >
                                <h4 className="font-bold text-gray-900 truncate">{ticket.title}</h4>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                        ticket.status === 'Open' ? 'bg-red-500 text-white' : 
                                        ticket.status === 'In Progress' ? 'bg-blue-500 text-white' : 
                                        'bg-gray-400 text-white'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-gray-500">Priority: {ticket.priority}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Column 2: Ticket Details / New Ticket Form */}
            <div className="flex-1 p-8 overflow-y-auto">
                {!selectedTicket ? (
                    renderNewTicketForm()
                ) : (
                    <UserTicketDetails 
                        selectedTicket={selectedTicket} 
                        onTicketUpdate={handleTicketUpdate}
                        onTicketClose={handleTicketClose}
                    />
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
