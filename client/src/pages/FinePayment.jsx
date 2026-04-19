import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api";

export default function FinePayment() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Card state
    const [cardNumber, setCardNumber] = useState("");
    const [cvv, setCvv] = useState("");
    const [expMonth, setExpMonth] = useState("");
    const [expYear, setExpYear] = useState("");
    const [cardError, setCardError] = useState("");

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

    function validateCard() {
        const raw = cardNumber.replace(/\s/g, "");

        if (raw.length !== 16) {
            return "Card number must be 16 digits";
        }

        if (!/^\d{3,4}$/.test(cvv)) {
            return "CVV must be 3 or 4 digits";
        }

        if (!expMonth || !expYear) {
            return "Expiration date is required";
        }

        const now = new Date();
        const exp = new Date(Number(expYear), Number(expMonth) - 1);

        if (exp < new Date(now.getFullYear(), now.getMonth())) {
            return "Card is expired";
        }

        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSubmitting(true);
        setError("");
        setCardError("");

        const validation = validateCard();
        if (validation) {
            setCardError(validation);
            setSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API}/api/finepayment`, {
                credentials: "include",
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cardNumber: cardNumber.replace(/\s/g, ""),
                    cvv,
                    expMonth,
                    expYear
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment failed");
            }

            await fetchBalance();

            // clear form after success
            setCardNumber("");
            setCvv("");
            setExpMonth("");
            setExpYear("");

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
                        <h1 className="text-2xl font-semibold tracking-wide">
                            Fine Payment
                        </h1>
                        <p className="text-stone-400 text-sm mt-1 tracking-widest uppercase">
                            Settle your outstanding balance
                        </p>
                    </div>

                    <div className="px-8 py-8 flex flex-col items-center gap-6">

                        {/* Balance */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-stone-400 text-sm tracking-widest uppercase">
                                Outstanding Balance
                            </span>

                            <span className={`text-4xl font-bold ${balance > 0 ? "text-red-400" : "text-green-400"}`}>
                                ${Number(balance).toFixed(2)}
                            </span>
                        </div>

                        {balance <= 0 ? (
                            <p className="text-stone-500 text-sm">
                                No outstanding fines — you're all clear.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

                                {/* Card Number */}
                                <input
                                    value={cardNumber}
                                    onChange={(e) =>
                                        setCardNumber(
                                            e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 16)
                                                .replace(/(.{4})/g, "$1 ")
                                                .trim()
                                        )
                                    }
                                    placeholder="Card Number"
                                    className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg tracking-widest"
                                    inputMode="numeric"
                                />

                                {/* Expiry */}
                                <div className="flex gap-3">

                                    <select
                                        value={expMonth}
                                        onChange={(e) => setExpMonth(e.target.value)}
                                        className="flex-1 px-3 py-3 bg-stone-800 border border-stone-700 rounded-lg"
                                    >
                                        <option value="">MM</option>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i} value={String(i + 1).padStart(2, "0")}>
                                                {String(i + 1).padStart(2, "0")}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={expYear}
                                        onChange={(e) => setExpYear(e.target.value)}
                                        className="flex-1 px-3 py-3 bg-stone-800 border border-stone-700 rounded-lg"
                                    >
                                        <option value="">YYYY</option>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i} value={new Date().getFullYear() + i}>
                                                {new Date().getFullYear() + i}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                                {/* CVV */}
                                <input
                                    value={cvv}
                                    onChange={(e) =>
                                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                                    }
                                    placeholder="CVV"
                                    className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg"
                                    inputMode="numeric"
                                />

                                {/* Errors */}
                                {cardError && (
                                    <p className="text-red-400 text-sm">{cardError}</p>
                                )}

                                {error && (
                                    <p className="text-red-400 text-sm">{error}</p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-lg transition"
                                >
                                    {submitting
                                        ? "Processing..."
                                        : `Pay $${Number(balance).toFixed(2)}`}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}