import React from 'react'
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AdminDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [agents, setAgents] = useState([]);
    const [filter, setFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [assignData, setAssignData] = useState({ agentId: "" });

    // Fetch all tickets
    const fetchTickets = async () => {
        try {
            const res = await axiosInstance.get("/tickets");
            setTickets(res.data.data || res.data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        }
    };

    // Fetch all agents (for assignment dropdown)
    const fetchAgents = async () => {
        try {
            const res = await axiosInstance.get("/users?role=agent");
            setAgents(res.data.data || res.data);
        } catch (err) {
            console.error("Error fetching agents:", err);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchAgents();
    }, []);

    // Assign ticket to agent
    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignData.agentId) return alert("Select an agent");

        try {
            await axiosInstance.put(`/tickets/${selectedTicket._id}/assign`, assignData);
            alert("Ticket assigned successfully!");
            setSelectedTicket(null);
            fetchTickets();
        } catch (err) {
            console.error("Error assigning ticket:", err);
            alert(err.response?.data?.message || "Assignment failed");
        }
    };

    // Filter tickets
    const filteredTickets =
        filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel: Ticket List */}
            <div className="w-1/3 bg-white border-r overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-indigo-700">All Tickets</h2>
                    <select
                        className="border text-sm rounded px-2 py-1"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {filteredTickets.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No tickets found.</p>
                ) : (
                    filteredTickets.map((ticket) => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-b cursor-pointer hover:bg-indigo-50 ${selectedTicket?._id === ticket._id ? "bg-indigo-100" : ""
                                }`}
                        >
                            <h4 className="font-medium text-indigo-700">{ticket.title}</h4>
                            <p className="text-sm text-gray-500">
                                {ticket.status} • {ticket.priority}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Right Panel: Ticket Details + Assignment */}
            <div className="flex-1 p-6 overflow-y-auto">
                {!selectedTicket ? (
                    <div className="max-w-lg mx-auto text-center text-gray-500 mt-40">
                        <p>Select a ticket to manage</p>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-indigo-700 mb-2">
                            {selectedTicket.title}
                        </h2>
                        <p className="text-gray-700 mb-3">{selectedTicket.description}</p>
                        <p className="text-sm text-gray-500 mb-1">
                            Status:{" "}
                            <span className="font-medium text-indigo-600">{selectedTicket.status}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-1">
                            Priority:{" "}
                            <span className="font-medium capitalize text-indigo-600">
                                {selectedTicket.priority}
                            </span>
                        </p>

                        {selectedTicket.agent ? (
                            <p className="text-sm text-gray-600 mb-2">
                                Assigned to:{" "}
                                <span className="font-medium">{selectedTicket.agent.name}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-red-500 mb-2">Not assigned yet</p>
                        )}

                        {/* Assign/Reassign Form */}
                        <form onSubmit={handleAssign} className="space-y-3 mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Assign to Agent
                            </label>
                            <select
                                value={assignData.agentId}
                                onChange={(e) => setAssignData({ agentId: e.target.value })}
                                className="w-full border rounded px-3 py-2 text-sm"
                            >
                                <option value="">-- Select Agent --</option>
                                {agents.map((agent) => (
                                    <option key={agent._id} value={agent._id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                            >
                                Assign Ticket
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
