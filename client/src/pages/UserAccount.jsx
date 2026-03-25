import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserAccount(){
    const [user, setUser] = useState(null);

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
    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
            <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-16 px-10 py-20 max-w-6xl mx-auto w-full">
                <div className="flex-1 flex flex-col gap-6">
                    <button onClick={() => navigate("/")} className="text-amber-600 text-sm tracking-[0.3em] uppercase">
                        Home
                    </button>
                    {user ? <h1>Logged in as {user.FirstName} {user.LastName}</h1> : <h1>Not logged in</h1>}
                    {user ?<h1>User ID : {user.UserID}</h1>: <h1>User ID invalid</h1>}
                    {user ? <h1>Email : {user.Email}</h1> : <h1>No email found</h1>}
                    {user ? <h1>Current Balance : ${user.Balance} </h1> : <h1>No balance</h1>}
                    <p className="text-amber-600 text-sm tracking-[0.3em] uppercase">
                        <button onClick={() => navigate("/")} className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide">
                            Logout
                        </button>
                    </p>
                    
                </div>
            </div>
        </div>
    )
}