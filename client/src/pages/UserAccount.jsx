import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function UserAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    useEffect(() => {
        async function checkLogin() {
            try {
                const response = await fetch("http://localhost:3000/api/me", {
                    credentials:"include"
                });

                const data = await response.json();

                if(response.ok){
                    setUser(data.user);
                    if (data.user?.UserType === 2) {
                        navigate("/librarian");
                    }
                } 
                else {
                    setUser(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        checkLogin();
    }, []);


    async function handleLogout(){
        setError("");

        try {
            const response = await fetch("http://localhost:3000/api/logout", {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-50 flex items-center justify-center">
        <p className="text-stone-400 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-amber-900/40">
        <h1
          onClick={() => navigate("/")}
          className="text-2xl font-serif tracking-widest text-amber-400 cursor-pointer hover:text-amber-300 transition"
        >
          Team 7 Library
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 transition rounded text-sm tracking-wide"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/itemDashboard")}
            className="px-5 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 transition rounded text-sm tracking-wide"
          >
            Dashboard
          </button>
          {user && (
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        {user ? (
          <div className="w-full max-w-lg bg-stone-900 border border-amber-900/40 rounded-xl shadow-2xl shadow-amber-950/50 p-10 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center text-amber-400 text-xl font-serif">
                {user.FirstName?.[0]}{user.LastName?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-serif text-amber-50">
                  {user.FirstName} {user.LastName}
                </h2>
                <p className="text-stone-500 text-sm tracking-wide">
                  {user.UserType || "Member"}
                </p>
              </div>
            </div>

            <div className="border-t border-amber-900/30" />

            {/* Info rows */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-sm tracking-wide">User ID</span>
                <span className="text-amber-50 font-mono text-sm">{user.UserID}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-sm tracking-wide">Email</span>
                <span className="text-amber-50 text-sm">{user.Email}</span>
              </div>
              {user.Status && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-sm tracking-wide">Status</span>
                  <span className={`text-sm font-medium px-3 py-0.5 rounded-full ${
                    user.Status === "Active"
                      ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                      : "bg-red-900/30 text-red-400 border border-red-800/40"
                  }`}>
                    {user.Status}
                  </span>
                </div>
              )}
              {user.CreatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-sm tracking-wide">Member Since</span>
                  <span className="text-amber-50 text-sm">
                    {new Date(user.CreatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-amber-900/30" />

            {/* Balance section */}
            <div className="bg-stone-800/50 border border-amber-900/20 rounded-lg px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-stone-400 text-xs tracking-wide uppercase">Current Balance</p>
                <p className={`text-2xl font-serif mt-1 ${
                  Number(user.Balance) > 0 ? "text-red-400" : "text-emerald-400"
                }`}>
                  ${Number(user.Balance).toFixed(2)}
                </p>
              </div>
              {Number(user.Balance) > 0 && (
                <button
                  onClick={() => navigate("/finepayment")}
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide text-sm"
                >
                  Pay Balance
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full py-3 border border-stone-700 text-stone-400 hover:border-red-800 hover:text-red-400 rounded transition tracking-wide text-sm"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Not logged in state */
          <div className="w-full max-w-md bg-stone-900 border border-amber-900/40 rounded-xl shadow-2xl shadow-amber-950/50 p-10 flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-stone-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-xl font-serif text-amber-50">Not Signed In</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Sign in to view your account details, check your balance, and manage your library activity.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
