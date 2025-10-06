import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, CheckCircle, ListTodo, Search, AlertTriangle, CheckCircle as CheckIcon, UserPlus, Tag, Send, ClipboardList, Zap } from 'lucide-react';

// =========================================================================
// CRITICAL: AXIOS INSTANCE STUB (NO DUMMY DATA)
//
// This local stub is required ONLY to prevent compilation errors in this environment. 
// It now returns empty data sets, forcing the dashboard to rely only on the API 
// for ticket and agent information.
//
// TO USE YOUR LIVE BACKEND: 
// 1. Delete this entire const block (down to the closing tag)
// 2. Uncomment or add your real import: import axiosInstance from "../api/axiosInstance";
// =========================================================================
const axiosInstance = {
    get: async (url) => {
        // Log the attempted API call to the console
        console.log(`STUBBED API CALL: GET ${url}. Returning empty array. Dashboard will appear blank until connected to a real API.`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency
        
        // Return empty array for both tickets and agents
        return { data: [] }; 
    },
    
    put: async (url, data) => { 
        console.log(`STUBBED API CALL: PUT ${url} with data:`, data);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulate a successful response that mimics an update
        return { 
            data: { 
                ...data, 
                _id: url.split('/')[2] || "TKT-000",
                updatedAt: new Date().toISOString()
            } 
        };
    }
};
// =========================================================================


// --- Constants for Status and Priority ---
const AVAILABLE_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const AVAILABLE_PRIORITIES = ['low', 'medium', 'high', 'critical'];

// Helper function for formatting dates
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// --- Sub-Component: Notification Bar ---
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const classes = type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-green-500 text-white';

    // Auto-close after 5 seconds
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center ${classes} transition-all duration-300`}>
            {type === 'error' ? <AlertTriangle className="w-5 h-5 mr-2" /> : <CheckIcon className="w-5 h-5 mr-2" />}
            <span className='font-medium'>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold opacity-75 hover:opacity-100">&times;</button>
        </div>
    );
};


// --- Sub-Component: AdminTicketDetails ---
const AdminTicketDetails = ({ ticket, agents, onAssign, onUpdateTicket, onUpdateNotification }) => {
    const [assignData, setAssignData] = useState({ agentId: "" });
    const [loadingAssignment, setLoadingAssignment] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Find the current assigned agent ID, if available in the agents list
        const currentAgentId = agents.find(a => a._id === ticket?.agent?._id)?._id || "";
        setAssignData({ agentId: currentAgentId });
    }, [ticket, agents]);

    const handleFieldUpdate = async (field, value) => {
        if (!ticket || ticket[field] === value) return;
        
        setIsUpdating(true);
        await onUpdateTicket(ticket._id, { [field]: value });
        setIsUpdating(false);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignData.agentId) {
            onUpdateNotification({ message: "Please select an agent.", type: 'error' });
            return;
        }

        setLoadingAssignment(true);
        await onAssign(ticket._id, assignData.agentId);
        setLoadingAssignment(false);
    };

    // Helper functions for dynamic styling
    const getPriorityClasses = (priority) => {
        if (!priority) return 'text-gray-700 bg-gray-200';
        const p = priority.toLowerCase();
        if (p === 'critical') return 'text-white bg-red-700 border-red-800';
        if (p === 'high') return 'text-red-700 bg-red-100 border-red-300';
        if (p === 'medium') return 'text-yellow-700 bg-yellow-100 border-yellow-300';
        if (p === 'low') return 'text-green-700 bg-green-100 border-green-300';
        return 'text-gray-700 bg-gray-200';
    };

    const getStatusClasses = (status) => {
        if (!status) return 'text-gray-700 bg-gray-200';
        const s = status.toLowerCase().replace(' ', '_');
        if (s === 'open') return 'text-red-700 bg-red-100 border-red-300';
        if (s === 'in_progress') return 'text-blue-700 bg-blue-100 border-blue-300';
        if (s === 'resolved') return 'text-green-700 bg-green-100 border-green-300';
        if (s === 'closed') return 'text-gray-700 bg-gray-100 border-gray-300';
        return 'text-gray-700 bg-gray-200';
    };

    if (!ticket) {
        return (
            <div className="flex justify-center items-center h-full bg-white rounded-xl shadow-inner border border-dashed">
                <p className="text-xl text-gray-400 font-medium">
                    Select a ticket from the list to view its details and management options.
                </p>
            </div>
        );
    }
    
    // Fallback for missing ticket fields (important since we are using empty data now)
    const ticketDescription = ticket.description || "No description provided.";
    const ticketUser = ticket.user?.name || 'Customer (ID: N/A)';
    const currentAgentName = ticket.agent?.name || 'Unassigned';

    return (
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-full overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{ticket.title || 'Untitled Ticket'}</h1>
                    <p className="text-sm font-mono text-gray-500">ID: {ticket._id || 'N/A'}</p>
                </div>
            </div>

            {/* Actions and Metadata */}
            <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center text-sm text-gray-600">
                
                {/* Status Dropdown */}
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-700 flex items-center"><ListTodo className="w-4 h-4 mr-1 text-indigo-500" /> Status:</span>
                    <select
                        value={ticket.status || 'open'}
                        onChange={(e) => handleFieldUpdate('status', e.target.value)}
                        className={`border rounded-lg px-3 py-1 text-sm font-medium transition ${getStatusClasses(ticket.status)}`}
                        disabled={isUpdating}
                    >
                        {AVAILABLE_STATUSES.map(s => (
                            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Priority Dropdown */}
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-700 flex items-center"><Zap className="w-4 h-4 mr-1 text-indigo-500" /> Priority:</span>
                    <select
                        value={ticket.priority || 'low'}
                        onChange={(e) => handleFieldUpdate('priority', e.target.value)}
                        className={`border rounded-lg px-3 py-1 text-sm font-medium transition ${getPriorityClasses(ticket.priority)}`}
                        disabled={isUpdating}
                    >
                        {AVAILABLE_PRIORITIES.map(p => (
                            <option key={p} value={p} className="capitalize">{p}</option>
                        ))}
                    </select>
                </div>
                
                <span className="flex items-center ml-auto">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                    <span className="font-semibold">Last Update:</span> {formatDateTime(ticket.updatedAt)}
                </span>
            </div>

            {/* Main Content Area (Description & Assignment) */}
            <div className="flex-1 overflow-y-auto p-6">
                
                {/* Description */}
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h3 className="text-xl font-bold mb-3 text-gray-800 flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-indigo-500" /> Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">{ticketDescription}</p>
                    <p className="text-sm text-gray-500">
                        <span className='font-semibold'>Reported By:</span> {ticketUser}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Created: {formatDateTime(ticket.createdAt)}
                    </p>
                </div>

                {/* Assignment Form */}
                <div className="mb-8 p-6 border border-indigo-300 bg-indigo-50 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center">
                        <UserPlus className="w-5 h-5 mr-2" /> Assign Agent
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Current Agent: <span className="font-bold text-indigo-800">{currentAgentName}</span>
                    </p>

                    <form onSubmit={handleAssignSubmit} className="flex space-x-3">
                        <select
                            value={assignData.agentId}
                            onChange={(e) => setAssignData({ agentId: e.target.value })}
                            className="flex-1 border border-indigo-300 rounded-lg px-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100"
                            disabled={loadingAssignment || agents.length === 0}
                        >
                            <option value="">-- Select Agent to Assign --</option>
                            {agents.map((agent) => (
                                <option key={agent._id} value={agent._id}>
                                    {agent.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400 flex items-center justify-center whitespace-nowrap"
                            disabled={loadingAssignment || !assignData.agentId || assignData.agentId === (ticket.agent?._id || "")}
                        >
                            {loadingAssignment ? 'Working...' : (ticket.agent ? 'Re-assign' : 'Assign Ticket')}
                            {!loadingAssignment && <Send className="w-4 h-4 ml-2" />}
                        </button>
                    </form>
                    {agents.length === 0 && <p className='text-sm text-red-500 mt-2'>No agents available to assign.</p>}
                </div>
            </div>
        </div>
    );
};


// --- Sub-Component: AdminTicketList (Used by AdminDashboard) ---
const AdminTicketList = ({ tickets, activeStatus, onSelectTicket, selectedTicket, searchQuery, isFetching }) => {
    
    // Normalize status for filtering comparison
    const normalizedStatus = (s) => s.toLowerCase().replace(' ', '_');

    const filteredTickets = tickets
        // 1. Filter by Status
        .filter((t) => activeStatus === "all" || normalizedStatus(t.status) === activeStatus)
        // 2. Filter by Search Query (Title, ID, or Description)
        .filter((t) => 
            !searchQuery || 
            t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const getStatusColor = (status) => {
        const s = normalizedStatus(status);
        if (s === 'open') return 'text-red-500 bg-red-100';
        if (s === 'in_progress') return 'text-blue-500 bg-blue-100';
        if (s === 'resolved') return 'text-green-500 bg-green-100';
        if (s === 'closed') return 'text-gray-500 bg-gray-100';
        return 'text-gray-500 bg-gray-100';
    };

    if (isFetching) {
        return <div className="p-4 text-center text-indigo-500 font-medium">Fetching tickets from API...</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
                <p className="p-4 text-gray-500 text-center italic">No tickets found for this filter/search.</p>
            ) : (
                filteredTickets.map((ticket) => (
                    <div
                        key={ticket._id}
                        onClick={() => onSelectTicket(ticket)}
                        className={`p-4 border-b cursor-pointer transition duration-150 
                            ${selectedTicket?._id === ticket._id ? "bg-indigo-100 border-l-4 border-indigo-600" : "hover:bg-gray-50 border-l-4 border-transparent"
                        }`}
                    >
                        <h4 className="font-semibold text-gray-900 truncate">{ticket.title}</h4>
                        <div className="flex justify-between items-center mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(ticket.status)}`}>
                                {ticket.status?.replace('_', ' ') || 'open'}
                            </span>
                            <span className="text-gray-500">{formatDateTime(ticket.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {ticket.agent ? `Assigned to: ${ticket.agent.name}` : <span className='text-red-500 font-medium'>Unassigned</span>}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
};


// --- Main Component: AdminDashboard ---
const AdminDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [activeStatus, setActiveStatus] = useState("all"); 
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [notification, setNotification] = useState({ message: "", type: "" });
    const [isFetching, setIsFetching] = useState(false);

    // --- Data Fetching ---
    const fetchTickets = useCallback(async () => {
        setIsFetching(true);
        try {
            const res = await axiosInstance.get("/tickets");
            
            // Normalize data 
            const fetchedTickets = res.data.data || res.data || [];
            const mappedTickets = fetchedTickets.map(t => ({
                ...t,
                status: t.status ? t.status.toLowerCase().replace(' ', '_') : 'open', 
                priority: t.priority ? t.priority.toLowerCase() : 'low'
            })).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)); 
            
            setTickets(mappedTickets);

            // If we selected a ticket previously, ensure the details panel stays updated 
            // with the latest data from the new fetch.
            if (selectedTicket) {
                 const latestTicket = mappedTickets.find(t => t._id === selectedTicket._id);
                 setSelectedTicket(latestTicket || null);
            }

        } catch (err) {
            console.error("Error fetching tickets:", err);
            setNotification({ message: "Failed to load tickets. Check API connection.", type: "error" });
            setTickets([]); 
        } finally {
            setIsFetching(false);
        }
    }, [selectedTicket]);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await axiosInstance.get("/users?role=agent"); 
            setAgents(res.data.data || res.data || []);
        } catch (err) {
            console.error("Error fetching agents:", err);
            setNotification({ message: "Failed to load agents list. Assignment feature may not work.", type: "error" });
            setAgents([]);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
        fetchAgents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchTickets, fetchAgents]); // Use fetch functions in dependency array


    // --- Ticket Management Handlers ---
    const handleUpdateTicket = async (ticketId, updateData) => {
        try {
            // Note: Update logic correctly points to the API endpoint
            await axiosInstance.put(`/tickets/${ticketId}`, updateData);
            
            // Re-fetch all tickets to update the view with the latest data from the API
            await fetchTickets(); 

            setNotification({ message: `Ticket updated successfully!`, type: "success" });

        } catch (err) {
            console.error("Error updating ticket:", err.response || err);
            setNotification({ 
                message: err.response?.data?.message || "Failed to update ticket.", 
                type: "error" 
            });
        }
    };

    // Handler specifically for assignment (uses /assign endpoint)
    const handleAssign = async (ticketId, agentId) => {
        try {
            // Note: Assignment logic correctly points to the API endpoint
            await axiosInstance.put(`/tickets/${ticketId}/assign`, { agentId });
            
            // Re-fetch tickets to get the ticket with the newly populated agent object
            await fetchTickets(); 

            setNotification({ message: "Ticket assigned successfully!", type: "success" });

        } catch (err) {
            console.error("Error assigning ticket:", err.response || err);
            setNotification({ 
                message: err.response?.data?.message || "Assignment failed. Check API route.", 
                type: "error" 
            });
        }
    };

    const handleNotificationClose = () => {
        setNotification({ message: "", type: "" });
    };

    // Helper function to render filter icons
    const renderFilterIcon = (status) => {
        const iconClasses = `w-5 h-5 mx-auto`;
        switch(status) {
            case 'open':
                return <ListTodo className={`${iconClasses} text-red-300`} />; 
            case 'in_progress':
                return <Clock className={`${iconClasses} text-blue-300`} />; 
            case 'resolved':
                return <CheckCircle className={`${iconClasses} text-green-300`} />; 
            case 'closed':
                return <Tag className={`${iconClasses} text-gray-300`} />; 
            case 'all':
            default:
                return <Users className={`${iconClasses} text-indigo-300`} />; 
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 font-inter antialiased">
            
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={handleNotificationClose} 
            />

            {/* Column 1: Dark Sidebar Navigation - Filters */}
            <div className="w-16 flex flex-col items-center bg-gray-900 text-white border-r border-gray-700 pt-6 shadow-xl z-10 flex-shrink-0">
                <h1 className="text-2xl font-extrabold mb-10 text-indigo-400">ADM</h1>
                
                {/* Status Filter Buttons */}
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                    <button
                        key={status}
                        onClick={() => {
                            setActiveStatus(status);
                            setSelectedTicket(null); // Clear details when changing filter
                        }}
                        title={status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                        className={`w-full py-4 transition duration-200 relative group
                            ${activeStatus === status 
                                ? 'bg-indigo-600 border-l-4 border-indigo-400 text-white' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                        }
                    >
                        {renderFilterIcon(status)}
                        <span className="text-[10px] mt-1 block font-medium capitalize">{status.replace('_', ' ')}</span>
                    </button>
                ))}
            </div>


            {/* Column 2: Ticket List - Search and Ticket Items */}
            <div className="w-96 flex flex-col border-r bg-white shadow-md flex-shrink-0">
                <div className="p-4 border-b flex items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 mr-4">Tickets ({tickets.length})</h2>
                    <div className='relative flex-1'>
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by ID, Title, or Description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                    </div>
                </div>
                
                <AdminTicketList 
                    tickets={tickets} 
                    activeStatus={activeStatus} 
                    onSelectTicket={setSelectedTicket} 
                    selectedTicket={selectedTicket}
                    searchQuery={searchQuery}
                    isFetching={isFetching}
                />
            </div>

            {/* Column 3: Ticket Details - Details, Status/Priority, and Assignment */}
            <div className="flex-1 overflow-y-auto p-8">
                <AdminTicketDetails 
                    ticket={selectedTicket} 
                    agents={agents} 
                    onAssign={handleAssign}
                    onUpdateTicket={handleUpdateTicket}
                    onUpdateNotification={setNotification}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
