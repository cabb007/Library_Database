import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserAccount(){
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function checkLogin() {
            try {
                const response = await fetch("http://localhost:3000/me", {
                    credentials:"include"
                });

                const data = await response.json();

                if(response.ok){
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error(err);
                
            }
        }

        checkLogin();
    }, []);


    async function handleLogout(){
        setError("");

        try {
            const response = await fetch("http://localhost:3000/logout", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({
                    UserID: user.UserID
                })
            });

            const data = await response.json();

            if(!response.ok) {
                throw new Error(data.error || data.message || "Failed to logout");
            }

            console.log("Logged out successfully");
            navigate("/login");

        } catch (err) {
            setError(err.message);
        }
    }

    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
            <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-16 px-10 py-20 max-w-6xl mx-auto w-full">
                <div className="flex-1 flex flex-col gap-6">
                    <button onClick={() => navigate("/")} className="text-amber-600 text-lg tracking-[0.3em] uppercase">
                        Home
                    </button>
                    {user ? <h1>Logged in as {user.FirstName} {user.LastName}</h1> : <h1>Not logged in</h1>}
                    {user ? <h1>User ID : {user.UserID}</h1> : <h1></h1>}
                    {user ? <h1>Email : {user.Email}</h1> : <h1></h1>}
                    {user ? <h1>Current Balance : ${user.Balance} 
                        <button onClick={() => navigate("/finepayment")} className="px-5 py-2 flex bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide">Pay balance</button>
                    </h1>: <h1></h1>} 
                    {user ? <p className="text-amber-600 tracking-[0.3em] uppercase">
                        <button onClick={() => handleLogout()} className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide">
                            Logout
                        </button>
                    </p> : <h1></h1>}
                    
                    
                </div>
            </div>
        </div>
    )
}