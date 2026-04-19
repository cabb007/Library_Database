import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function UserAccount() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loans, setLoans] = useState([]);
    const [holds, setHolds] = useState([]);
    const [error, setError] = useState("");
    const [returnError, setReturnError] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        async function checkLogin() {
            try {
                const response = await fetch(`${API}/api/me`, { credentials: "include" });
                const data = await response.json();
                if (response.ok) {
                    setUser(data.user);
                    await Promise.all([
                        fetchBalance(),
                        fetchLoans(),
                        fetchHolds(),
                        fetchNotifications()
                    ]);
                } else {
                    setUser(null);
                    setBalance(0);
                }
            } catch (err) {
                console.error(err);
            }
        }
        checkLogin();
    }, []);

    async function fetchBalance() {
        try {
            const response = await fetch(`${API}/api/user/balance`, { credentials: "include" });
            const data = await response.json();
            setBalance(response.ok ? data.Balance : 0);
        } catch (err) {
            console.error(err);
            setBalance(0);
        }
    }

    async function fetchLoans() {
        try {
            const response = await fetch(`${API}/api/user/loans`, { credentials: "include" });
            const data = await response.json();
            setLoans(response.ok ? data : []);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchHolds() {
        try {
            const response = await fetch(`${API}/api/user/holds`, { credentials: "include" });
            const data = await response.json();
            setHolds(response.ok ? data : []);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchNotifications() {
        try {
            const response = await fetch(`${API}/api/notifications`, {
                credentials: "include"
            });

            if (!response.ok) return;

            const data = await response.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleReturn(loanId) {
        setReturnError("");
        try {
            const response = await fetch(`${API}/api/user/loans/${loanId}/return`, {
                method: "POST",
                credentials: "include"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to return item");
            await fetchLoans();
        } catch (err) {
            setReturnError(err.message);
        }
    }

    async function handleLogout() {
        setError("");
        try {
            const response = await fetch(`${API}/api/logout`, {
                method: "POST",
                credentials: "include"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.message || "Failed to logout");
            setUser(null);
            setBalance(0);
            navigate("/login");
        } catch (err) {
            setError(err.message);
        }
    }

    const initials = user
        ? `${user.FirstName?.[0] ?? ""}${user.LastName?.[0] ?? ""}`.toUpperCase()
        : "";

    const activeLoans = loans.filter(l => !l.ReturnDate);
    const pastLoans = loans.filter(l => l.ReturnDate);

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    }

    function isOverdue(dueDateStr) {
        return !dueDateStr ? false : new Date(dueDateStr) < new Date();
    }

    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center px-4 py-12">

            <div className="w-full max-w-2xl">

                <button
                    onClick={() => navigate("/")}
                    className="mb-6 text-amber-600 text-sm tracking-[0.2em] uppercase hover:text-amber-400 transition"
                >
                    ← Home
                </button>
                {/* HEADER ROW: Home + Notifications */}
                <div className="flex items-center justify-between mb-6">

                    {/* LEFT SIDE: Home (keeps original button behavior) */}
                    <div />

                    {/* RIGHT SIDE: Notifications */}
                    <div className="relative">

                        <button
                            onClick={() => setNotifOpen(prev => !prev)}
                            className="relative px-3 py-2 border border-amber-700 rounded hover:bg-amber-900/30 transition"
                        >
                            🔔

                            {(notifications?.length ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                            )}
                        </button>

                        {notifOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-stone-900 border border-amber-700 rounded shadow-xl z-50">

                                <div className="p-2 border-b border-amber-900/30 text-amber-300 text-sm">
                                    Notifications
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {(notifications?.length ?? 0) === 0 ? (
                                        <div className="p-3 text-stone-400 text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map((n, i) => (
                                            <div
                                                key={n.NotificationID || i}
                                                className="p-3 border-b border-amber-900/10 flex items-start justify-between gap-3"
                                            >
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <div className="text-amber-200 text-sm font-semibold">
                                                        {n.header || n.Header}
                                                    </div>
                                                    <div className="text-stone-400 text-xs">
                                                        {n.body || n.Body}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await fetch(`${API}/api/notifications/read`, {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                credentials: "include",
                                                                body: JSON.stringify({
                                                                    NotificationID: n.NotificationID
                                                                })
                                                            });

                                                            setNotifications(prev =>
                                                                prev.filter(x => x.NotificationID !== n.NotificationID)
                                                            );
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                    className="text-xs px-2 py-1 border border-amber-500 text-amber-200 rounded hover:bg-amber-800/30 transition shrink-0"
                                                >
                                                    Read
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {/* Profile Card */}
                <div className="bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-xl mb-8">

                    <div className="bg-stone-800 px-8 py-8 flex items-center gap-5 border-b border-stone-700">
                        <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-2xl font-bold text-stone-950 shrink-0">
                            {initials || "?"}
                        </div>
                        <div>
                            {user ? (
                                <>
                                    <h1 className="text-2xl font-semibold tracking-wide">
                                        {user.FirstName} {user.LastName}
                                    </h1>
                                    <p className="text-stone-400 text-sm mt-0.5 tracking-widest uppercase">Member</p>
                                </>
                            ) : (
                                <h1 className="text-xl text-stone-400">Not logged in</h1>
                            )}
                        </div>
                    </div>

                    {user && (
                        <div className="px-8 py-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                                <span className="text-stone-400 text-sm tracking-widest uppercase">User ID</span>
                                <span className="text-amber-100 font-mono">{user.UserID}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-stone-800 pb-4">
                                <span className="text-stone-400 text-sm tracking-widest uppercase">Email</span>
                                <span className="text-amber-100">{user.Email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-stone-400 text-sm tracking-widest uppercase">Balance</span>
                                <div className="flex items-center gap-3">
                                    <span className={`font-semibold text-lg ${balance > 0 ? "text-red-400" : "text-green-400"}`}>
                                        ${Number(balance).toFixed(2)}
                                    </span>
                                    {balance > 0 && (
                                        <button
                                            onClick={() => navigate("/finepayment")}
                                            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-stone-950 text-sm font-semibold rounded transition"
                                        >
                                            Pay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {user && (
                        <div className="px-8 py-5 border-t border-stone-700">
                            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                            <button
                                onClick={handleLogout}
                                className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded-lg transition tracking-wide"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Loans Section */}
                {user && (
                    <>
                        {returnError && (
                            <p className="text-red-400 text-sm mb-4">{returnError}</p>
                        )}

                        {/* Active Loans */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold tracking-widest uppercase text-amber-500 mb-3">
                                Active Loans ({activeLoans.length})
                            </h2>
                            {activeLoans.length === 0 ? (
                                <p className="text-stone-500 text-sm">No active loans.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {activeLoans.map(loan => (
                                        <div
                                            key={loan.LoanID}
                                            className="bg-stone-900 border border-stone-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="font-medium truncate">{loan.Title}</span>
                                                <span className="text-stone-400 text-xs">{loan.ItemTypeName}</span>
                                                <span className={`text-xs mt-1 ${isOverdue(loan.DueDate) ? "text-red-400" : "text-stone-400"}`}>
                                                    Due: {formatDate(loan.DueDate)}
                                                    {isOverdue(loan.DueDate) && " — Overdue"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleReturn(loan.LoanID)}
                                                className="shrink-0 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 text-sm font-semibold rounded-lg transition"
                                            >
                                                Return
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Holds */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold tracking-widest uppercase text-amber-500 mb-3">
                                Holds ({holds.filter(h => h.HoldStatus === 0).length})
                            </h2>
                            {holds.filter(h => h.HoldStatus === 0).length === 0 ? (
                                <p className="text-stone-500 text-sm">No active holds.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {holds.filter(h => h.HoldStatus === 0).map(hold => (
                                        <div
                                            key={hold.HoldID}
                                            className="bg-stone-900 border border-stone-700 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="font-medium truncate">{hold.Title}</span>
                                                <span className="text-stone-400 text-xs">{hold.ItemTypeName}</span>
                                                <span className="text-stone-400 text-xs mt-1">
                                                    Placed: {formatDate(hold.CreatedAt)}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-xs text-amber-500 font-semibold tracking-wide uppercase">
                                                Queued
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past Loans */}
                        <div>
                            <h2 className="text-lg font-semibold tracking-widest uppercase text-stone-500 mb-3">
                                Past Loans ({pastLoans.length})
                            </h2>
                            {pastLoans.length === 0 ? (
                                <p className="text-stone-500 text-sm">No past loans.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {pastLoans.map(loan => (
                                        <div
                                            key={loan.LoanID}
                                            className="bg-stone-900 border border-stone-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 opacity-60"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="font-medium truncate">{loan.Title}</span>
                                                <span className="text-stone-400 text-xs">{loan.ItemTypeName}</span>
                                                <span className="text-stone-500 text-xs mt-1">
                                                    Returned: {formatDate(loan.ReturnDate)}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-xs text-green-600 font-semibold tracking-wide uppercase">
                                                Returned
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
