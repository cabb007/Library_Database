import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    FirstName: "", LastName: "", Email: "", Password: "", UserType: 0
  });

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

  async function fetchUsers() {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/users", { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setView("users");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load users");
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, UserType: Number(form.UserType) })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setForm({ FirstName: "", LastName: "", Email: "", Password: "", UserType: 0 });
      setShowForm(false);
      fetchUsers();
    } catch {
      setError("Failed to add user");
    }
  }

  async function handleDelete(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/users/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      fetchUsers();
    } catch {
      setError("Failed to delete user");
    }
  }

  async function handleLogout() {
    try {
      await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        credentials: "include"
      });
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error(err.message);
    }
  }

  if (!user) return null;

  const userTypeLabel = (type) => {
    if (type === 0) return "Student";
    if (type === 1) return "Faculty";
    if (type === 2) return "Librarian";
    return "Unknown";
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Librarian Dashboard</h1>
        <div>
          <span style={{ marginRight: "1rem" }}>Welcome, {user.FirstName} {user.LastName}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {view === "home" && (
        <div>
          <button onClick={fetchUsers}>Users</button>
        </div>
      )}

      {view === "users" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button onClick={() => setView("home")}>Back</button>
            <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add User"}</button>
          </div>

          {showForm && (
            <form onSubmit={handleAddUser} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <input placeholder="First Name" value={form.FirstName} onChange={e => setForm({ ...form, FirstName: e.target.value })} required />
              <input placeholder="Last Name" value={form.LastName} onChange={e => setForm({ ...form, LastName: e.target.value })} required />
              <input placeholder="Email" type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} required />
              <input placeholder="Password" type="password" value={form.Password} onChange={e => setForm({ ...form, Password: e.target.value })} required />
              <select value={form.UserType} onChange={e => setForm({ ...form, UserType: e.target.value })}>
                <option value={0}>Student</option>
                <option value={1}>Faculty</option>
              </select>
              <button type="submit">Create</button>
            </form>
          )}

          <h2>Users ({users.length})</h2>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: "0.5rem" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.UserID}>
                  <td>{u.UserID}</td>
                  <td>{u.FirstName} {u.LastName}</td>
                  <td>{u.Email}</td>
                  <td>{userTypeLabel(u.UserType)}</td>
                  <td>${Number(u.Balance).toFixed(2)}</td>
                  <td>{u.Status === 1 ? "Active" : "Inactive"}</td>
                  <td>
                    <button onClick={() => handleDelete(u.UserID)} disabled={u.UserID === user.UserID}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}