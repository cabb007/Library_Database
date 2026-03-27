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
        navigate("/login");  // not a librarian, go back to login
      } else {
        setUser(data.user);  // is a librarian, allow access to the page
      }
    }
    checkAccess();
  }, []);

  // Don't render anything until we confirm they're a librarian
  if (!user) return null;

  return (
    <div>
      <h1>Librarian Dashboard</h1>
      <p>Welcome, {user.FirstName} {user.LastName}</p>
    </div>
  );
}