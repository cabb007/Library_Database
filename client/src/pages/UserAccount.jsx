import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function UserAccount() {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        async function checkLogin() {
            try {
                const response = await fetch(`${API}/api/me`, {
                    credentials:"include"
                });

                const data = await response.json();

                if (response.ok) {
                    setUser(data.user);
                    await fetchBalance();
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
        const response = await fetch(`${API}/api/user/balance`, {
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok) {
            setBalance(data.Balance);
        } else {
            setBalance(0);
        }
    } catch (err) {
        console.error(err);
        setBalance(0);
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

            if (!response.ok) {
                throw new Error(data.error || data.message || "Failed to logout");
            }

            setUser(null); // important UI reset
            setBalance(0); 
            console.log("Logged out successfully");
            navigate("/login");

        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
            <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-16 px-10 py-20 max-w-6xl mx-auto w-full">

                <div className="flex-1 flex flex-col gap-6">

                    <button
                        onClick={() => navigate("/")}
                        className="text-amber-600 text-lg tracking-[0.3em] uppercase"
                    >
                        Home
                    </button>

                    {user ? (
                        <h1>Logged in as {user.FirstName} {user.LastName}</h1>
                    ) : (
                        <h1>Not logged in</h1>
                    )}

                    {user ? <h1>User ID : {user.UserID}</h1> : <h1></h1>}
                    {user ? <h1>Email : {user.Email}</h1> : <h1></h1>}

                    {user ? (
                        <h1>
                            Current Balance : ${balance}

                            <button
                                onClick={() => navigate("/finepayment")}
                                className="px-5 py-2 ml-4 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
                            >
                                Pay balance
                            </button>
                        </h1>
                    ) : (
                        <h1></h1>
                    )}

                    {user ? (
                        <p className="text-amber-600 tracking-[0.3em] uppercase">
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
                            >
                                Logout
                            </button>
                        </p>
                    ) : (
                        <h1></h1>
                    )}

                    {error && (
                        <p className="text-red-400">{error}</p>
                    )}

                </div>
            </div>
        </div>
    );
}