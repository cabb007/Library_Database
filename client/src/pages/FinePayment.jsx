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
        <div className="flex-col text-center gap-5 justify-center">
            <button
                className="bg-amber-700"
                onClick={() => navigate("/")}
            >
                Home
            </button>

            <h1>Fine Payment Page</h1>

            <div>
                {user ? <h1>Balance : ${balance}</h1> : <p></p>}
            </div>

            <div>
                <form onSubmit={handleSubmit}>
                    <button
                        type="submit"
                        disabled={submitting || balance <= 0}
                        className="mt-2 px-5 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
                    >
                        {submitting ? "Processing..." : "Pay Full Balance"}
                    </button>
                </form>
            </div>

            {error && <p className="text-red-400">{error}</p>}
        </div>
    );
}