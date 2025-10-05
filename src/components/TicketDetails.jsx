import React, { useState, useEffect } from 'react';
// Assuming these paths are correct for your setup
import axiosInstance from "../api/axiosInstance"; 
import { useAuth } from '../context/AuthContext'; 
import { User, Tag, Clock, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const TicketDetails = ({ selectedTicket, onTicketUpdate, onTicketClose }) => {
    const { user } = useAuth();
    const [ticket, setTicket] = useState(selectedTicket || null); 
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Update internal state when external prop changes (new ticket selected)
    useEffect(() => {
        setTicket(selectedTicket);
        setError(null); // Clear errors for the new ticket
        setNewComment("");
    }, [selectedTicket]);

    // Simple loading check (display when no ticket is selected)
    if (!ticket) {
        return (
            <div className="flex justify-center items-center h-full bg-white rounded-lg shadow-inner">
                <p className="text-xl text-gray-400 font-medium">
                    ← Select a ticket to view details
                </p>
            </div>
        );
    }
    
    // --- STATUS UPDATE FIX ---
    const handleStatusUpdate = async (newStatus) => {
        if (ticket.status === newStatus || statusUpdating) return;

        setStatusUpdating(true);
        setError(null);

        try {
            // PUT request to update the status on the backend
            const res = await axiosInstance.put(`/tickets/${ticket._id}`, { status: newStatus });
            
            const updatedTicketData = res.data.ticket || res.data; 

            // Update local state and notify the parent list component
            setTicket(updatedTicketData); 
            onTicketUpdate(updatedTicketData); 

            // If closing, clear the selected ticket in the parent view
            if (newStatus === 'closed' && onTicketClose) {
                // We call onTicketUpdate to refresh the list, but not necessary to call onTicketClose prop here 
                // as the selection change will happen based on the updated state.
            }
        } catch (err) {
            console.error(`Error updating status to ${newStatus}:`, err);
            setError(`Failed to update status to ${newStatus}. Server error.`);
        } finally {
            setStatusUpdating(false);
        }
    };
    // --- END STATUS UPDATE FIX ---

    // Function to add a comment (kept robust as per your original code)
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        setError(null);
        
        if (!user || !user.id || !ticket._id) {
            setError("Authentication or Ticket ID missing.");
            setLoading(false);
            return;
        }

        const commentData = {
            text: newComment,
            ticketId: ticket._id, 
            userId: user.id,
        };

        try {
            // POST request to add the comment
            const res = await axiosInstance.post(`/tickets/${ticket._id}/comments`, commentData);
            
            const updatedTicketData = res.data.ticket || res.data; 

            setTicket(updatedTicketData); 
            onTicketUpdate(updatedTicketData); 
            setNewComment("");
        } catch (err) {
            console.error("Error adding comment:", err);
            setError("Failed to add comment. Please check network logs.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine status color (matching TicketList.jsx)
    const getStatusClasses = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'text-red-700 bg-red-100 border-red-300';
            case 'pending': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
            case 'closed': return 'text-green-700 bg-green-100 border-green-300';
            default: return 'text-gray-700 bg-gray-100 border-gray-300';
        }
    };

    // GUARANTEES 'comments' is an array, defaulting to [] if undefined/null
    const comments = ticket.comments || []; 
    const isClosed = ticket.status.toLowerCase() === 'closed';

    return (
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
            
            {/* Header & Status Card */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{ticket.title}</h1>
                    <p className="text-sm font-mono text-gray-500">Ticket ID: {ticket._id}</p>
                </div>

                <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase shadow-sm ${getStatusClasses(ticket.status)}`}>
                    {ticket.status}
                </div>
            </div>

            {/* Actions and Metadata Bar */}
            <div className="p-4 border-b flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center space-x-6">
                    <span className="flex items-center">
                        <User className="w-4 h-4 mr-1.5 text-indigo-500" />
                        <span className="font-semibold">User:</span> {ticket.userId?.substring(0, 8) || 'N/A'}
                    </span>
                    <span className="flex items-center">
                        <Tag className="w-4 h-4 mr-1.5 text-indigo-500" />
                        <span className="font-semibold">Created:</span> {formatDateTime(ticket.createdAt)}
                    </span>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                        <span className="font-semibold">Updated:</span> {formatDateTime(ticket.updatedAt)}
                    </span>
                </div>

                {/* Status Update Button (Agent Action) */}
                {user?.role !== 'user' && (
                    <button 
                        onClick={() => handleStatusUpdate(isClosed ? 'open' : 'closed')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 shadow-md flex items-center 
                            ${isClosed 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        disabled={statusUpdating}
                    >
                        {statusUpdating ? 'Updating...' : (isClosed ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />)}
                        {isClosed ? 'Reopen Ticket' : 'Resolve Ticket'}
                    </button>
                )}
            </div>

            {/* Main Content Area (Description & Discussion) */}
            <div className="flex-1 overflow-y-auto p-6">
                
                {/* Ticket Description */}
                <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">Details</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
                
                {/* Discussion Section */}
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Discussion ({comments.length})
                </h3>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="p-4 bg-white rounded-lg shadow-inner text-gray-500 italic text-center text-sm border">No comments yet. Start the discussion!</p>
                    ) : (
                        comments.map((comment, index) => (
                            <div 
                                key={index} 
                                className={`p-4 rounded-xl border transition duration-100 ${comment.userId === user?.id 
                                    ? 'bg-indigo-50 border-indigo-200 self-end ml-auto' 
                                    : 'bg-white border-gray-100'}`
                                }
                            >
                                <p className="text-xs font-semibold flex justify-between mb-1">
                                    <span className={comment.userId === user?.id ? 'text-indigo-700' : 'text-gray-700'}>
                                        {comment.userId === user?.id ? 'You' : `Agent (${comment.userId?.substring(0, 8)})`} 
                                    </span>
                                    <span className="text-gray-500 font-normal">
                                        {comment.createdAt ? formatDateTime(comment.createdAt) : 'Just now'}
                                    </span>
                                </p>
                                <p className="mt-1 text-gray-800">{comment.text}</p>
                            </div>
                        )) // <-- Missing closing parenthesis was here
                    )}
                </div>
            </div>

            {/* Comment Submission Footer */}
            <div className="border-t p-6 bg-gray-50 flex-shrink-0">
                {error && (
                    <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" /> {error}
                    </div>
                )}
                
                <form onSubmit={handleAddComment} className="flex space-x-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={isClosed ? "Ticket is closed, reopen to add comments." : "Add a comment..."}
                        rows="1"
                        className="flex-1 border rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 resize-none"
                        disabled={loading || isClosed}
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400 flex items-center"
                        disabled={loading || isClosed || !newComment.trim()}
                    >
                        {loading ? 'Sending...' : 'Send'}
                        <Send className="w-4 h-4 ml-2" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TicketDetails;
