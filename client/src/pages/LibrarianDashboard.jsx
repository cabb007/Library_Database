import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAccess() {
      const res = await fetch("http://localhost:3000/api/me", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || data.user?.UserType !== 2) {
        navigate("/login");
      } else {
        setUser(data.user);
      }
    }
    checkAccess();
  }, []);

  // 👇 handleLogout must be BEFORE the return
  async function handleLogout() {
    try {
      const response = await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to logout");
      }

      setUser(null);
      console.log("Logged out successfully");
      navigate("/login");

    } catch (err) {
      console.error(err.message);
    }
  }

  if (!user) return null;

  // 👇 button must be INSIDE the return
  return (
    <div>
      <h1>Librarian Dashboard</h1>
      <p>Welcome, {user.FirstName} {user.LastName}</p>
      <button
        onClick={handleLogout}
        className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
      >
        Logout
      </button>
    </div>
  );
}