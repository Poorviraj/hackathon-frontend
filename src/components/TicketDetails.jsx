import React, { useState, useEffect } from 'react';
// FIX: The paths ../ and ../../ both failed. Reverting to the one-level up path (../) 
// as it is the theoretically correct path for components/ -> src/ and is the most likely 
// candidate to resolve if the environment is sensitive.
import axiosInstance from "../api/axiosInstance";
import { useAuth } from '../context/AuthContext';
import { User, Tag, Clock, Send, AlertCircle } from 'lucide-react';

// Define available statuses
const AVAILABLE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    // Ensure the date is treated as UTC if necessary, or simply use local time representation
    return new Date(dateString).toLocaleString();
};

// Component to represent a single comment
const CommentItem = ({ comment, userId }) => {
    // Backend uses 'user' for the commenter's ID and 'message' for the text
    const commenterId = comment.user;
    const isCurrentUser = commenterId === userId;
    // Safety check for commenterId
    const authorRole = isCurrentUser ? 'You' : `Agent (${commenterId?.substring(0, 8) || 'N/A'})`;

    return (
        <div
            className={`p-4 rounded-xl border transition duration-100 shadow-sm
                ${isCurrentUser
                    ? 'bg-indigo-50 border-indigo-200 self-end ml-auto'
                    : 'bg-white border-gray-100'}`
            }
        >
            <p className="text-xs font-semibold flex justify-between mb-1">
                <span className={isCurrentUser ? 'text-indigo-700' : 'text-gray-700'}>
                    {authorRole}
                </span>
                <span className="text-gray-500 font-normal">
                    {/* Backend uses 'timestamp' for the date */}
                    {comment.timestamp ? formatDateTime(comment.timestamp) : 'Just now'}
                </span>
            </p>
            {/* Backend uses 'message' for the comment text */}
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">{comment.message}</p>
        </div>
    );
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
        // IMPORTANT: The prop 'selectedTicket' is the source of truth for the list data.
        // We MUST set the local state 'ticket' whenever 'selectedTicket' changes.
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

    // --- STATUS UPDATE FUNCTION ---
    const handleStatusUpdate = async (e) => {
        const newStatus = e.target.value;
        if (ticket.status === newStatus || statusUpdating) return;

        // We rely on axiosInstance to pick up the token once the user object is present.
        if (!user || !user.id) {
            setError("Authentication required to update ticket status. User ID missing.");
            // Reset select element to previous status on auth failure
            e.target.value = ticket.status;
            return;
        }

        setStatusUpdating(true);
        setError(null);

        try {
            // Correcting the URL to match the router definition: PUT /tickets/:id/status
            const res = await axiosInstance.put(`/tickets/${ticket._id}/status`, { status: newStatus });

            const updatedTicketData = res.data.ticket || res.data;

            // CRITICAL: Update local state AND notify the parent list component
            setTicket(updatedTicketData);
            onTicketUpdate(updatedTicketData);

        } catch (err) {
            console.error(`Error updating status to ${newStatus}:`, err);

            // Log the detailed error from the server
            const errorMsg = err.response?.data?.message || err.message || `Failed to update status. Status: ${err.response?.status}`;

            // Set error state with the detailed message and revert the selection
            setError(`Status update failed: ${errorMsg}. Please ensure your authentication is valid.`);
            e.target.value = ticket.status; // Revert dropdown selection

        } finally {
            setStatusUpdating(false);
        }
    };
    // --- END STATUS UPDATE FUNCTION ---

    // Function to add a comment (kept robust as per your original code)
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        setError(null);

        // Ensure necessary IDs are present
        if (!user || !user.id || !ticket._id) {
            setError("Authentication or Ticket ID missing. Cannot add comment.");
            setLoading(false);
            return;
        }

        // Using 'message' key to match the backend controller (req.body.message)
        const commentData = {
            message: newComment,
        };

        try {
            // Correcting the URL to match the router definition: POST /tickets/:id/comment
            const url = `/tickets/${ticket._id}/comments`;
            const res = await axiosInstance.post(url, commentData);

            // The backend responds with the updated ticket object which includes the new comment array.
            const updatedTicketData = res.data.ticket || res.data;

            // CRITICAL FIX: Update local state to immediately show the new comment
            setTicket(updatedTicketData);
            
            // CRITICAL: Notify the parent component (Dashboard/TicketList) to update its list
            // This is essential to prevent the parent from resetting selectedTicket to an old value.
            onTicketUpdate(updatedTicketData); 

            setNewComment("");
        } catch (err) {
            console.error("Error adding comment:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to add comment. Check network.';

            if (err.response && err.response.status === 403) {
                setError(`Comment failed (403 Forbidden). You are not authorized to comment on this ticket.`);
            } else {
                setError(`Comment failed: ${errorMsg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine status color 
    const getStatusClasses = (status) => {
        // FIX: Add null/undefined check for status before attempting to call toLowerCase().
        if (!status) return 'text-gray-700 bg-gray-100 border-gray-300';
        
        switch (status.toLowerCase()) {
            case 'open': return 'text-red-700 bg-red-100 border-red-300';
            case 'in progress': return 'text-blue-700 bg-blue-100 border-blue-300';
            case 'resolved': return 'text-green-700 bg-green-100 border-green-300';
            case 'closed': return 'text-gray-700 bg-gray-100 border-gray-300';
            default: return 'text-gray-700 bg-gray-100 border-gray-300';
        }
    };

    const comments = ticket.comments || [];
    
    // This was already fixed, but is good practice to keep.
    const isClosed = (ticket.status?.toLowerCase() || '') === 'closed';

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

                {/* Status Update Dropdown (Agent Action) */}
                {/* Note: Assuming 'user' role is the only one restricted from updating status */}
                {user?.role !== 'user' && (
                    <div className="flex items-center">
                        <label htmlFor="status-select" className="text-gray-700 font-semibold mr-2">Update Status:</label>
                        <select
                            id="status-select"
                            value={ticket.status}
                            onChange={handleStatusUpdate}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border shadow-md transition duration-200 focus:ring-indigo-500 focus:border-indigo-500 ${statusUpdating ? 'opacity-70' : ''}`}
                            disabled={statusUpdating}
                        >
                            {AVAILABLE_STATUSES.map(status => (
                                <option
                                    key={status}
                                    value={status}
                                    className={`${getStatusClasses(status)}`}
                                >
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
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
                        // Render CommentItem component for each comment
                        comments.map((comment, index) => (
                            <CommentItem
                                // Ensure key is reliable, use index if no _id exists on the comment object
                                key={comment._id || index}
                                comment={comment}
                                userId={user?.id}
                            />
                        ))
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
