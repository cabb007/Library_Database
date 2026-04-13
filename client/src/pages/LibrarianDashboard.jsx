import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");
  const [catalogTab, setCatalogTab] = useState("books");
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [literature, setLiterature] = useState([]);
  const [media, setMedia] = useState([]);
  const [devices, setDevices] = useState([]);
  const [form, setForm] = useState({
    FirstName: "", LastName: "", Email: "", Password: "", UserType: 0
  });
  const [showLitForm, setShowLitForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [litForm, setLitForm] = useState({
    ItemID: "", Title: "", ItemType: 1, Author: "", Publisher: "", PublicationYear: "", Copies: 1
  });
  const [mediaForm, setMediaForm] = useState({
    Title: "", ItemType: 1, Producer: "", DurationMinutes: "", Copies: 1
  });
  const [deviceForm, setDeviceForm] = useState({
    Title: "", ItemType: 1, Manufacturer: "", Model: "", Copies: 1
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

    async function fetchCatalog() {
    try {
      const res = await fetch("http://localhost:3000/api/literature");
      const data = await res.json();
      setLiterature(Array.isArray(data[0]) ? data[0] : data);
    } catch {
      setError("Failed to load catalog");
    }
    setView("catalog");
    setCatalogTab("books");
  }

   async function fetchMedia() {
    try {
      const res = await fetch("http://localhost:3000/api/media");
      const data = await res.json();
      setMedia(Array.isArray(data[0]) ? data[0] : data);
    } catch {
      setError("Failed to load Media");
    }
    setView("catalog");
    setCatalogTab("media");
  }

  async function fetchDevices() {
    try {
      const res = await fetch("http://localhost:3000/api/devices");
      const data = await res.json();
      setDevices(Array.isArray(data[0]) ? data[0] : data);
    } catch {
      setError("Failed to load devices");
    }
    setView("catalog");
    setCatalogTab("devices");
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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchUsers}>Users</button>
          <button onClick={fetchCatalog}>Catalog</button>
        </div>

      )}

      {view === "catalog" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button onClick={() => setView("home")}>Back</button>
            <button onClick={() => setCatalogTab("books")}>Books</button>
            <button onClick={fetchMedia}>Media</button>
            <button onClick={fetchDevices}>Devices</button>
          </div>
          {catalogTab === "books" && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button onClick={() => setShowLitForm(!showLitForm)}>
                  {showLitForm ? "Cancel" : "Add Literature"}
                </button>
              </div>

              {showLitForm && (
                <form style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                  <input placeholder="ISBN / Item ID *" value={litForm.ItemID} onChange={e => setLitForm({ ...litForm, ItemID: e.target.value })} />
                  <input placeholder="Title *" value={litForm.Title} onChange={e => setLitForm({ ...litForm, Title: e.target.value })} />
                  <select value={litForm.ItemType} onChange={e => setLitForm({ ...litForm, ItemType: Number(e.target.value) })}>
                    <option value={1}>Book</option>
                    <option value={2}>Textbook</option>
                    <option value={3}>Magazine</option>
                    <option value={4}>Audiobook</option>
                  </select>
                  <input placeholder="Author *" value={litForm.Author} onChange={e => setLitForm({ ...litForm, Author: e.target.value })} />
                  <input placeholder="Publisher" value={litForm.Publisher} onChange={e => setLitForm({ ...litForm, Publisher: e.target.value })} />
                  <input placeholder="Publication Year" type="number" value={litForm.PublicationYear} onChange={e => setLitForm({ ...litForm, PublicationYear: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={litForm.Copies} onChange={e => setLitForm({ ...litForm, Copies: e.target.value })} />
                  <button type="button">Add</button>
                </form>
              )}

              <input
                placeholder="Search by title or author..."
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
              <h2>Books ({literature.length})</h2>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ISBN</th><th>Title</th><th>Publisher</th>
            <th>Author</th><th>Year</th><th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {literature.filter(l =>
            `${l.Title} ${l.Author}`.toLowerCase().includes(bookSearch.toLowerCase())
          ).map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Title}</td>
              <td>{item.Publisher}</td>
              <td>{item.Author}</td>
              <td>{item.PublicationYear}</td>
              <td>{item.AvailableCopies}</td>
              <td>
                    <button>
                      Delete (DWY) 
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>
          </div>
        )}
          {catalogTab === "media" && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button onClick={() => setShowMediaForm(!showMediaForm)}>
                  {showMediaForm ? "Cancel" : "Add Media"}
                </button>
              </div>

              {showMediaForm && (
                <form style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                  <input placeholder="Title *" value={mediaForm.Title} onChange={e => setMediaForm({ ...mediaForm, Title: e.target.value })} />
                  <select value={mediaForm.ItemType} onChange={e => setMediaForm({ ...mediaForm, ItemType: Number(e.target.value) })}>
                    <option value={1}>DVD / CD</option>
                    <option value={2}>Blu-ray</option>
                    <option value={3}>Vinyl</option>
                  </select>
                  <input placeholder="Producer" value={mediaForm.Producer} onChange={e => setMediaForm({ ...mediaForm, Producer: e.target.value })} />
                  <input placeholder="Duration (minutes)" type="number" min="1" value={mediaForm.DurationMinutes} onChange={e => setMediaForm({ ...mediaForm, DurationMinutes: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={mediaForm.Copies} onChange={e => setMediaForm({ ...mediaForm, Copies: e.target.value })} />
                  <button type="button">Add</button>
                </form>
              )}

              <input
                placeholder="Search by ID or Name..."
                value={mediaSearch}
                onChange={e => setMediaSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
              <h2>Media ({media.length})</h2>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Device ID</th><th>Name</th><th>Producer</th><th>Duration</th>
            <th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {media.filter(m =>
            `${m.ItemID} ${m.Title}`.toLowerCase().includes(mediaSearch.toLowerCase())
          ).map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Title}</td>
              <td>{item.Producer}</td>
              <td>{item.DurationMinutes}</td>
              <td>{item.AvailableCopies}</td>
              <td>
                    <button>
                      Delete (DWY) 
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

          )}
          {catalogTab === "devices" && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button onClick={() => setShowDeviceForm(!showDeviceForm)}>
                  {showDeviceForm ? "Cancel" : "Add Device"}
                </button>
              </div>

              {showDeviceForm && (
                <form style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                  <input placeholder="Title *" value={deviceForm.Title} onChange={e => setDeviceForm({ ...deviceForm, Title: e.target.value })} />
                  <select value={deviceForm.ItemType} onChange={e => setDeviceForm({ ...deviceForm, ItemType: Number(e.target.value) })}>
                    <option value={1}>Laptop</option>
                    <option value={2}>Tablet</option>
                    <option value={3}>Calculator</option>
                  </select>
                  <input placeholder="Manufacturer" value={deviceForm.Manufacturer} onChange={e => setDeviceForm({ ...deviceForm, Manufacturer: e.target.value })} />
                  <input placeholder="Model" value={deviceForm.Model} onChange={e => setDeviceForm({ ...deviceForm, Model: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={deviceForm.Copies} onChange={e => setDeviceForm({ ...deviceForm, Copies: e.target.value })} />
                  <button type="button">Add</button>
                </form>
              )}

              <input
                placeholder="Search by ID, Name, or Manufacturer..."
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
              <h2>Devices ({devices.length})</h2>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Device ID</th><th>Name</th><th>Manufacturer</th>
            <th>Model</th><th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.filter(d =>
            `${d.ItemID} ${d.Title} ${d.Manufacturer}`.toLowerCase().includes(deviceSearch.toLowerCase())
          ).
          map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Title}</td>
              <td>{item.Manufacturer}</td>
              <td>{item.Model}</td>
              <td>{item.AvailableCopies}</td>
              <td>
                    <button>
                      Delete (DWY) 
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      )}
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

          <input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
          />
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
              {users.filter(u =>
                `${u.FirstName} ${u.LastName} ${u.Email} ${u.UserType}`.toLowerCase().includes(userSearch.toLowerCase())
              ).map(u => (
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