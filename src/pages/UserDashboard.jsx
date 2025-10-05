import React from 'react'
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const UserDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", priority: "Low" });

    // Fetch user’s tickets
    const fetchTickets = async () => {
        try {
            const res = await axiosInstance.get("/tickets");
            setTickets(res.data.data || res.data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Handle create ticket
    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosInstance.post("/tickets", form);
            alert("Ticket created successfully!");
            setForm({ title: "", description: "", priority: "Low" });
            fetchTickets();
            setSelectedTicket(res.data.ticket);
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert(error.response?.data?.message || "Error creating ticket");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Panel — Ticket List */}
            <div className="w-1/3 bg-white border-r overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-indigo-700">My Tickets</h2>
                    <button
                        onClick={() => setSelectedTicket(null)}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        + New
                    </button>
                </div>

                {tickets.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No tickets yet.</p>
                ) : (
                    tickets.map((ticket) => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-b cursor-pointer hover:bg-indigo-50 ${selectedTicket?._id === ticket._id ? "bg-indigo-100" : ""
                                }`}
                        >
                            <h4 className="font-medium text-indigo-700">{ticket.title}</h4>
                            <p className="text-sm text-gray-500">{ticket.status}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Right Panel — Ticket Details or New Ticket Form */}
            <div className="flex-1 p-6 overflow-y-auto">
                {!selectedTicket ? (
                    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Create New Ticket</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full border rounded px-3 py-2 mt-1 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows="3"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full border rounded px-3 py-2 mt-1 text-sm"
                                    required
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className="w-full border rounded px-3 py-2 mt-1 text-sm"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                            >
                                Create Ticket
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-indigo-700 mb-2">{selectedTicket.title}</h2>
                        <p className="text-gray-700 mb-3">{selectedTicket.description}</p>
                        <p className="text-sm text-gray-500 mb-1">
                            Status: <span className="font-medium text-indigo-600">{selectedTicket.status}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            Priority:{" "}
                            <span className="font-medium capitalize text-indigo-600">
                                {selectedTicket.priority}
                            </span>
                        </p>
                        {selectedTicket.sla?.deadlineAt && (
                            <p className="text-sm text-gray-500 mt-2">
                                ⏰ SLA Deadline:{" "}
                                {new Date(selectedTicket.sla.deadlineAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
