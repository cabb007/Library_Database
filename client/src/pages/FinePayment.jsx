import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

export default function FinePayment() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function checkLogin() {
        try {
            const response = await fetch(`${API}/api/me`, {
                credentials: "include"
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
            } else {
                setUser(null);
                alert("You must be logged in to access this page!");
                navigate("/");
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchBalance() {
        try {
            const response = await fetch(`${API}/api/user/balance`, {
                credentials: "include"
            });

            if (!response.ok) {
                setBalance(0);
                return;
            }

            const data = await response.json();
            setBalance(Number(data.Balance) || 0);
        } catch (err) {
            console.error(err);
            setBalance(0);
        }
    }

    useEffect(() => {
        async function loadPage() {
            await checkLogin();
            await fetchBalance();
        }

        loadPage();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const response = await fetch(`${API}/api/finepayment`, {
                credentials: "include",
                method: "PUT"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment failed");
            }

            await fetchBalance();
            console.log("All unpaid fines paid successfully");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center px-4 py-12">
            <div className="w-full max-w-md">

                <button
                    onClick={() => navigate("/useraccount")}
                    className="mb-6 text-amber-600 text-sm tracking-[0.2em] uppercase hover:text-amber-400 transition"
                >
                    ← Account
                </button>

                <div className="bg-stone-900 border border-stone-700 rounded-2xl overflow-hidden shadow-xl">

                    <div className="bg-stone-800 px-8 py-8 border-b border-stone-700">
                        <h1 className="text-2xl font-semibold tracking-wide">Fine Payment</h1>
                        <p className="text-stone-400 text-sm mt-1 tracking-widest uppercase">Settle your outstanding balance</p>
                    </div>

                    <div className="px-8 py-8 flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-stone-400 text-sm tracking-widest uppercase">Outstanding Balance</span>
                            <span className={`text-4xl font-bold ${balance > 0 ? "text-red-400" : "text-green-400"}`}>
                                ${Number(balance).toFixed(2)}
                            </span>
                        </div>

                        {balance <= 0 ? (
                            <p className="text-stone-500 text-sm">No outstanding fines — you're all clear.</p>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition tracking-wide"
                                >
                                    {submitting ? "Processing..." : `Pay $${Number(balance).toFixed(2)}`}
                                </button>
                            </form>
                        )}

                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}