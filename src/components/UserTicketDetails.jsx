import React, { useState, useEffect, useRef } from 'react';
import { Tag, Clock, Send, AlertCircle } from 'lucide-react';

// =========================================================================
// FIX: Local Stubs to Resolve Compilation Errors
// NOTE: These stubs MUST be replaced with your project's actual imports 
// when integrating into your full application to enable real API calls.
// =========================================================================

const useAuth = () => ({ 
    user: { id: 'mock-user-123', role: 'user' } 
});

// Mock axios instance that simulates a successful POST request and returns 
// the updated ticket data, including the new comment.
const axiosInstance = {
    post: async (url, commentData) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // This function will need access to the current ticket object if we were to 
        // fully mock it here, but we will rely on the component's internal state
        // and the onTicketUpdate prop to manage the state updates for now.
        // Returning a generic success structure to let the component proceed.
        
        // Since the comment logic relies on 'setTicket' and 'onTicketUpdate' to refresh the data,
        // we will let the calling function (handleAddComment) manage the data merge logic 
        // to ensure the mock works without needing the ticket object here.
        return {
            data: {
                message: "Mock comment posted successfully."
            }
        };
    }
}
// =========================================================================


// Define available statuses (simplified for User view)
const AVAILABLE_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    // Use 'en-US' or a generic locale for portability
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Component to represent a single comment
const CommentItem = ({ comment, userId }) => {
    const commenterId = comment.user; 
    const isCurrentUser = commenterId === userId;
    const authorRole = isCurrentUser ? 'You' : `Agent`; 

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
                    {comment.timestamp ? formatDateTime(comment.timestamp) : 'Just now'}
                </span>
            </p>
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">{comment.message}</p>
        </div>
    );
};


const UserTicketDetails = ({ selectedTicket, onTicketUpdate }) => {
    const { user } = useAuth(); 
    
    // We use selectedTicket prop as the initial state for 'ticket'
    const [ticket, setTicket] = useState(selectedTicket || null);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // CRITICAL for preventing blank screen: Reset local state when a different ticket is selected.
    useEffect(() => {
        setTicket(selectedTicket);
        setError(null);
        setNewComment("");
    }, [selectedTicket]);

    if (!ticket) {
        return (
            <div className="flex justify-center items-center h-full bg-white rounded-lg shadow-inner">
                <p className="text-xl text-gray-400 font-medium">
                    ← Select a ticket to view details
                </p>
            </div>
        );
    }

    const handleAddComment = async (e) => {
        e.preventDefault();
        
        // **Client-Side Validation**
        if (!newComment.trim()) {
            setError("The comment message cannot be empty. Please type a message.");
            return;
        }

        setLoading(true);
        setError(null); // Clear previous errors

        // Ensure necessary IDs are present
        if (!user || !user.id || !ticket._id) {
            setError("Authentication or Ticket ID missing. Cannot add comment.");
            setLoading(false);
            return;
        }

        const commentData = {
            message: newComment,
        };
        
        // Define a mock updated ticket based on the current local state
        const mockUpdatedTicketData = {
            ...ticket,
            comments: [
                ...(ticket.comments || []),
                {
                    _id: 'mock-cmt-' + Date.now().toString(),
                    message: newComment,
                    timestamp: new Date().toISOString(),
                    user: user.id,
                }
            ],
            updatedAt: new Date().toISOString(),
        };

        try {
            // CRITICAL: Attempting the REAL API call now
            const url = `/tickets/${ticket._id}/comments`;

            // Note: Since we are using the mock, this will NOT send data to the backend,
            // but it will allow us to test the state update flow correctly.
            await axiosInstance.post(url, commentData); 
            
            // =========================================================================
            // CORE FIX FOR SCREEN CLEARING ISSUE:
            // We use the mock updated data here because the axiosInstance stub 
            // returned generic success. In a real app, 'res.data.ticket' would 
            // be used here. We use the locally created mock data for state update.
            // =========================================================================
            const updatedTicketData = mockUpdatedTicketData;


            // CRITICAL FIX 1: Update local state immediately with the new comment.
            setTicket(updatedTicketData);
            
            // CRITICAL FIX 2: Update parent state (dashboard list AND selected ticket).
            onTicketUpdate(updatedTicketData); 

            setNewComment("");
        } catch (err) {
            console.error("Error adding comment:", err.response?.data || err);
            
            // Since we are using a stub, if we fail here, it's an unexpected internal error
            const serverErrorMsg = err.response?.data?.message || err.message; 
            const errorMsg = serverErrorMsg || 'Failed to post comment due to an internal stub issue.';

            setError(`Failed to post comment: ${errorMsg}`);

        } finally {
            setLoading(false);
        }
    };


    const getStatusClasses = (status) => {
        if (!status) return 'text-gray-700 bg-gray-100 border-gray-300';
        
        switch (status.toLowerCase()) {
            case 'open': return 'text-red-700 bg-red-100 border-red-300';
            case 'in progress': return 'text-blue-700 bg-blue-100 border-blue-300';
            case 'resolved': return 'text-green-700 bg-green-100 border-green-300';
            case 'closed': return 'text-gray-700 bg-gray-100 border-gray-300';
            default: return 'text-gray-700 bg-gray-100 border-gray-300';
        }
    };

    // Use local state 'ticket' for comments, which is updated immediately after posting.
    const comments = ticket.comments || [];
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

            {/* Actions and Metadata Bar (Simplified for User View) */}
            <div className="p-4 border-b flex items-center text-sm text-gray-600 space-x-6">
                <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-1.5 text-indigo-500" />
                    <span className="font-semibold">Created:</span> {formatDateTime(ticket.createdAt)}
                </span>
                <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                    <span className="font-semibold">Last Update:</span> {formatDateTime(ticket.updatedAt)}
                </span>
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
                        <p className="p-4 bg-white rounded-lg shadow-inner text-gray-500 italic text-center text-sm border">No comments yet. Add a message below!</p>
                    ) : (
                        comments.map((comment, index) => (
                            <CommentItem
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
                        className="w-[100px] bg-indigo-600 text-white p-3 rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition duration-150 disabled:bg-gray-400 flex items-center justify-center"
                        // Disable if loading, closed, or if the textarea content is empty/whitespace
                        disabled={loading || isClosed || !newComment.trim()}
                    >
                        {loading ? 'Sending...' : 'Send'}
                        {!loading && <Send className="w-4 h-4 ml-2" />}
                    </button>
                </form>
            </div>
            <div className="sr-only">
                {console.log("UserTicketDetails mounted for ticket:", ticket?._id)}
            </div>
        </div>
    );
};

export default UserTicketDetails;
