import { useEffect, useRef, useState } from "react";
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [copies, setCopies] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});
  const editUserPanelRef = useRef(null);
  const [editingLit, setEditingLit] = useState(null);
  const [editLitForm, setEditLitForm] = useState({});
  const editLitPanelRef = useRef(null);
  const [editingMedia, setEditingMedia] = useState(null);
  const [editMediaForm, setEditMediaForm] = useState({});
  const editMediaPanelRef = useRef(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editDeviceForm, setEditDeviceForm] = useState({});
  const editDevicePanelRef = useRef(null);
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

  function startEditUser(u) {
    if (editingUser?.UserID === u.UserID) {
      setEditingUser(null);
      return;
    }
    setEditingUser(u);
    setEditUserForm({
      FirstName: u.FirstName,
      LastName: u.LastName,
      Email: u.Email,
      UserType: u.UserType,
      Status: u.Status,
    });
    setTimeout(() => editUserPanelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/users/${editingUser.UserID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          FirstName: editUserForm.FirstName,
          LastName: editUserForm.LastName,
          Email: editUserForm.Email,
          UserType: Number(editUserForm.UserType),
          Status: Number(editUserForm.Status),
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditingUser(null);
      fetchUsers();
    } catch {
      setError("Failed to update user");
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

  async function startEditLit(item) {
    if (editingLit?.ItemID === item.ItemID) {
      setEditingLit(null);
      setSelectedItem(null);
      setCopies([]);
      return;
    }
    setEditingLit(item);
    setSelectedItem(item);
    setEditLitForm({
      Title: item.Title,
      ItemType: item.ItemType ?? 1,
      Author: item.Author,
      Publisher: item.Publisher || "",
      PublicationYear: item.PublicationYear || ""
    });
    await loadCopies(item);
    setTimeout(() => editLitPanelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSaveLit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/literature/${editingLit.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Title: editLitForm.Title,
          ItemType: Number(editLitForm.ItemType),
          Author: editLitForm.Author,
          Publisher: editLitForm.Publisher,
          PublicationYear: editLitForm.PublicationYear ? Number(editLitForm.PublicationYear) : null
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditingLit(null);
      fetchCatalog();
    } catch {
      setError("Failed to update literature");
    }
  }

  async function handleAddLiterature(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/catalog/literature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...litForm,
          ItemID: Number(litForm.ItemID),
          ItemType: Number(litForm.ItemType),
          PublicationYear: litForm.PublicationYear ? Number(litForm.PublicationYear) : null,
          Copies: Number(litForm.Copies)
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setLitForm({ ItemID: "", Title: "", ItemType: 1, Author: "", Publisher: "", PublicationYear: "", Copies: 1 });
      setShowLitForm(false);
      fetchCatalog();
    } catch {
      setError("Failed to add literature");
    }
  }

  //catalog refresh that runs after every copy deletion without resetting the view.
  async function refreshCatalogData() {
    try {
      if (catalogTab === "books") {
        const res = await fetch("http://localhost:3000/api/literature");
        const data = await res.json();
        setLiterature(Array.isArray(data[0]) ? data[0] : data);
      } else if (catalogTab === "media") {
        const res = await fetch("http://localhost:3000/api/media");
        const data = await res.json();
        setMedia(Array.isArray(data[0]) ? data[0] : data);
      } else if (catalogTab === "devices") {
        const res = await fetch("http://localhost:3000/api/devices");
        const data = await res.json();
        setDevices(Array.isArray(data[0]) ? data[0] : data);
      }
    } catch {
      setError("Failed to refresh catalog");
    }
  }

  async function loadCopies(item) {
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/${item.ItemID}/copies`, {
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setCopies(data);
    } catch {
      setError("Failed to fetch copies");
    }
  }



  async function handleAddCopy(itemId) {
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/catalog/copies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ItemID: itemId })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await loadCopies(selectedItem);
      await refreshCatalogData();
    } catch {
      setError("Failed to add copy");
    }
  }

  async function handleDeleteCopy(copyId) {
    if (!confirm("Are you sure you want to delete this copy?")) return;
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/copies/${copyId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await loadCopies(selectedItem);
      await refreshCatalogData();
    } catch {
      setError("Failed to delete copy");
    }
  }

  async function handleAddDevice(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/catalog/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...deviceForm,
          ItemType: Number(deviceForm.ItemType),
          Copies: Number(deviceForm.Copies)
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDeviceForm({ Title: "", ItemType: 1, Manufacturer: "", Model: "", Copies: 1 });
      setShowDeviceForm(false);
      fetchDevices();
    } catch {
      setError("Failed to add device");
    }
  }

  async function handleDeleteDevice(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/devices/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchDevices();
    } catch {
      setError("Failed to delete device");
    }
  }

  async function startEditMedia(item) {
    if (editingMedia?.ItemID === item.ItemID) {
      setEditingMedia(null);
      setSelectedItem(null);
      setCopies([]);
      return;
    }
    setEditingMedia(item);
    setSelectedItem(item);
    setEditMediaForm({
      Title: item.Title,
      ItemType: item.ItemType ?? 1,
      Producer: item.Producer || "",
      DurationMinutes: item.DurationMinutes || ""
    });
    await loadCopies(item);
    setTimeout(() => editMediaPanelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSaveMedia(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/media/${editingMedia.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Title: editMediaForm.Title,
          ItemType: Number(editMediaForm.ItemType),
          Producer: editMediaForm.Producer,
          DurationMinutes: editMediaForm.DurationMinutes ? Number(editMediaForm.DurationMinutes) : null
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditingMedia(null);
      fetchMedia();
    } catch {
      setError("Failed to update media");
    }
  }

  async function startEditDevice(item) {
    if (editingDevice?.ItemID === item.ItemID) {
      setEditingDevice(null);
      setSelectedItem(null);
      setCopies([]);
      return;
    }
    setEditingDevice(item);
    setSelectedItem(item);
    setEditDeviceForm({
      Title: item.Title,
      ItemType: item.ItemType ?? 1,
      Manufacturer: item.Manufacturer || "",
      Model: item.Model || ""
    });
    await loadCopies(item);
    setTimeout(() => editDevicePanelRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSaveDevice(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/devices/${editingDevice.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Title: editDeviceForm.Title,
          ItemType: Number(editDeviceForm.ItemType),
          Manufacturer: editDeviceForm.Manufacturer,
          Model: editDeviceForm.Model || null
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEditingDevice(null);
      fetchDevices();
    } catch {
      setError("Failed to update device");
    }
  }

  async function handleAddMedia(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/librarian/catalog/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...mediaForm,
          ItemType: Number(mediaForm.ItemType),
          DurationMinutes: mediaForm.DurationMinutes ? Number(mediaForm.DurationMinutes) : null,
          Copies: Number(mediaForm.Copies)
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMediaForm({ Title: "", ItemType: 1, Producer: "", DurationMinutes: "", Copies: 1 });
      setShowMediaForm(false);
      fetchMedia();
    } catch {
      setError("Failed to add media");
    }
  }

  async function handleDeleteMedia(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/media/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchMedia();
    } catch {
      setError("Failed to delete media");
    }
  }

  async function handleDeleteLiterature(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/librarian/catalog/literature/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      fetchCatalog();
    } catch {
      setError("Failed to delete literature");
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
    setSelectedItem(null);
    setCopies([]);
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
    setSelectedItem(null);
    setCopies([]);
    setEditingLit(null);
    setEditingDevice(null);
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
    setSelectedItem(null);
    setCopies([]);
    setEditingLit(null);
    setEditingMedia(null);
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
          <button onClick={() => navigate("/")} style={{ marginRight: "0.5rem" }}>Student View</button>
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
            <button onClick={() => { setView("home"); setEditingLit(null); setEditingMedia(null); setEditingDevice(null); }}>Back</button>
            <button onClick={() => { setCatalogTab("books"); setSelectedItem(null); setCopies([]); setEditingMedia(null); setEditingDevice(null); }}>Books</button>
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
                <form onSubmit={handleAddLiterature} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
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
                  <button type="submit">Add</button>
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
            <th>ISBN</th><th>Title</th><th>Type</th><th>Publisher</th>
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
              <td>{["", "Book", "Textbook", "Magazine", "Audiobook"][item.ItemType] ?? "—"}</td>
              <td>{item.Publisher}</td>
              <td>{item.Author}</td>
              <td>{item.PublicationYear}</td>
              <td>{item.AvailableCopies}</td>
              <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => startEditLit(item)}>
                      {editingLit?.ItemID === item.ItemID ? "Cancel" : "Edit"}
                    </button>
                    <button onClick={() => handleDeleteLiterature(item.ItemID)}>
                      Delete
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>

          {editingLit && catalogTab === "books" && (
            <div ref={editLitPanelRef} style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #aaa", background: "#f9f9f9" }}>
              <h3>Edit: "{editingLit.Title}" (ID: {editingLit.ItemID})</h3>
              <form onSubmit={handleSaveLit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  placeholder="Title *"
                  value={editLitForm.Title}
                  onChange={e => setEditLitForm({ ...editLitForm, Title: e.target.value })}
                  required
                />
                <select
                  value={editLitForm.ItemType}
                  onChange={e => setEditLitForm({ ...editLitForm, ItemType: Number(e.target.value) })}
                >
                  <option value={1}>Book</option>
                  <option value={2}>Textbook</option>
                  <option value={3}>Magazine</option>
                  <option value={4}>Audiobook</option>
                </select>
                <input
                  placeholder="Author *"
                  value={editLitForm.Author}
                  onChange={e => setEditLitForm({ ...editLitForm, Author: e.target.value })}
                  required
                />
                <input
                  placeholder="Publisher"
                  value={editLitForm.Publisher}
                  onChange={e => setEditLitForm({ ...editLitForm, Publisher: e.target.value })}
                />
                <input
                  placeholder="Publication Year"
                  type="number"
                  value={editLitForm.PublicationYear}
                  onChange={e => setEditLitForm({ ...editLitForm, PublicationYear: e.target.value })}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => { setEditingLit(null); setSelectedItem(null); setCopies([]); }}>Cancel</button>
              </form>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h4 style={{ margin: 0 }}>Copies</h4>
                <button onClick={() => handleAddCopy(selectedItem.ItemID)}>+ Add Copy</button>
              </div>
              {copies.length === 0 ? (
                <p>No copies found.</p>
              ) : (
                <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Copy ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copies.map(copy => (
                      <tr key={copy.CopyID}>
                        <td>{copy.CopyID}</td>
                        <td>{copy.CopyStatus === 0 ? "Available" : "On Loan"}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteCopy(copy.CopyID)}
                            disabled={copy.CopyStatus !== 0}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
                <form onSubmit={handleAddMedia} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                  <input placeholder="Title *" value={mediaForm.Title} onChange={e => setMediaForm({ ...mediaForm, Title: e.target.value })} />
                  <select value={mediaForm.ItemType} onChange={e => setMediaForm({ ...mediaForm, ItemType: Number(e.target.value) })}>
                    <option value={1}>DVD / CD</option>
                    <option value={2}>Blu-ray</option>
                    <option value={3}>Vinyl</option>
                  </select>
                  <input placeholder="Producer" value={mediaForm.Producer} onChange={e => setMediaForm({ ...mediaForm, Producer: e.target.value })} />
                  <input placeholder="Duration (minutes)" type="number" min="1" value={mediaForm.DurationMinutes} onChange={e => setMediaForm({ ...mediaForm, DurationMinutes: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={mediaForm.Copies} onChange={e => setMediaForm({ ...mediaForm, Copies: e.target.value })} />
                  <button type="submit">Add</button>
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
            <th>Device ID</th><th>Name</th><th>Type</th><th>Producer</th><th>Duration</th>
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
              <td>{["", "DVD/CD", "Blu-ray", "Vinyl"][item.ItemType] ?? "—"}</td>
              <td>{item.Producer}</td>
              <td>{item.DurationMinutes}</td>
              <td>{item.AvailableCopies}</td>
              <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => startEditMedia(item)}>
                      {editingMedia?.ItemID === item.ItemID ? "Cancel" : "Edit"}
                    </button>
                    <button onClick={() => handleDeleteMedia(item.ItemID)}>
                      Delete
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>

          {editingMedia && catalogTab === "media" && (
            <div ref={editMediaPanelRef} style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #aaa", background: "#f9f9f9" }}>
              <h3>Edit: "{editingMedia.Title}" (ID: {editingMedia.ItemID})</h3>
              <form onSubmit={handleSaveMedia} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  placeholder="Title *"
                  value={editMediaForm.Title}
                  onChange={e => setEditMediaForm({ ...editMediaForm, Title: e.target.value })}
                  required
                />
                <select
                  value={editMediaForm.ItemType}
                  onChange={e => setEditMediaForm({ ...editMediaForm, ItemType: Number(e.target.value) })}
                >
                  <option value={1}>DVD / CD</option>
                  <option value={2}>Blu-ray</option>
                  <option value={3}>Vinyl</option>
                </select>
                <input
                  placeholder="Producer"
                  value={editMediaForm.Producer}
                  onChange={e => setEditMediaForm({ ...editMediaForm, Producer: e.target.value })}
                />
                <input
                  placeholder="Duration (minutes)"
                  type="number"
                  min="1"
                  value={editMediaForm.DurationMinutes}
                  onChange={e => setEditMediaForm({ ...editMediaForm, DurationMinutes: e.target.value })}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => { setEditingMedia(null); setSelectedItem(null); setCopies([]); }}>Cancel</button>
              </form>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h4 style={{ margin: 0 }}>Copies</h4>
                <button onClick={() => handleAddCopy(selectedItem.ItemID)}>+ Add Copy</button>
              </div>
              {copies.length === 0 ? (
                <p>No copies found.</p>
              ) : (
                <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Copy ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copies.map(copy => (
                      <tr key={copy.CopyID}>
                        <td>{copy.CopyID}</td>
                        <td>{copy.CopyStatus === 0 ? "Available" : "On Loan"}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteCopy(copy.CopyID)}
                            disabled={copy.CopyStatus !== 0}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
                <form onSubmit={handleAddDevice} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                  <input placeholder="Title *" value={deviceForm.Title} onChange={e => setDeviceForm({ ...deviceForm, Title: e.target.value })} />
                  <select value={deviceForm.ItemType} onChange={e => setDeviceForm({ ...deviceForm, ItemType: Number(e.target.value) })}>
                    <option value={1}>Laptop</option>
                    <option value={2}>Tablet</option>
                    <option value={3}>Calculator</option>
                  </select>
                  <input placeholder="Manufacturer" value={deviceForm.Manufacturer} onChange={e => setDeviceForm({ ...deviceForm, Manufacturer: e.target.value })} />
                  <input placeholder="Model" value={deviceForm.Model} onChange={e => setDeviceForm({ ...deviceForm, Model: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={deviceForm.Copies} onChange={e => setDeviceForm({ ...deviceForm, Copies: e.target.value })} />
                  <button type="submit">Add</button>
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
            <th>Device ID</th><th>Name</th><th>Type</th><th>Manufacturer</th>
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
              <td>{["", "Laptop", "Tablet", "Calculator"][item.ItemType] ?? "—"}</td>
              <td>{item.Manufacturer}</td>
              <td>{item.Model}</td>
              <td>{item.AvailableCopies}</td>
              <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button onClick={() => startEditDevice(item)}>
                      {editingDevice?.ItemID === item.ItemID ? "Cancel" : "Edit"}
                    </button>
                    <button onClick={() => handleDeleteDevice(item.ItemID)}>
                      Delete
                    </button>
                  </td>
            </tr>
          ))}
        </tbody>
      </table>

          {editingDevice && catalogTab === "devices" && (
            <div ref={editDevicePanelRef} style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #aaa", background: "#f9f9f9" }}>
              <h3>Edit: "{editingDevice.Title}" (ID: {editingDevice.ItemID})</h3>
              <form onSubmit={handleSaveDevice} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <input
                  placeholder="Title *"
                  value={editDeviceForm.Title}
                  onChange={e => setEditDeviceForm({ ...editDeviceForm, Title: e.target.value })}
                  required
                />
                <select
                  value={editDeviceForm.ItemType}
                  onChange={e => setEditDeviceForm({ ...editDeviceForm, ItemType: Number(e.target.value) })}
                >
                  <option value={1}>Laptop</option>
                  <option value={2}>Tablet</option>
                  <option value={3}>Calculator</option>
                </select>
                <input
                  placeholder="Manufacturer"
                  value={editDeviceForm.Manufacturer}
                  onChange={e => setEditDeviceForm({ ...editDeviceForm, Manufacturer: e.target.value })}
                />
                <input
                  placeholder="Model"
                  value={editDeviceForm.Model}
                  onChange={e => setEditDeviceForm({ ...editDeviceForm, Model: e.target.value })}
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => { setEditingDevice(null); setSelectedItem(null); setCopies([]); }}>Cancel</button>
              </form>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <h4 style={{ margin: 0 }}>Copies</h4>
                <button onClick={() => handleAddCopy(selectedItem.ItemID)}>+ Add Copy</button>
              </div>
              {copies.length === 0 ? (
                <p>No copies found.</p>
              ) : (
                <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Copy ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {copies.map(copy => (
                      <tr key={copy.CopyID}>
                        <td>{copy.CopyID}</td>
                        <td>{copy.CopyStatus === 0 ? "Available" : "On Loan"}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteCopy(copy.CopyID)}
                            disabled={copy.CopyStatus !== 0}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
      </div>
      )}
        </div>
      )}

      {view === "users" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button onClick={() => { setView("home"); setEditingUser(null); }}>Back</button>
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
                <th>Loan Period</th>
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
                  <td>{u.LoanPeriodDays} days</td>
                  <td>{u.Status === 1 ? "Active" : "Inactive"}</td>
                  <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => startEditUser(u)}
                      disabled={u.UserID === user.UserID}
                    >
                      {editingUser?.UserID === u.UserID ? "Cancel" : "Edit"}
                    </button>
                    <button onClick={() => handleDelete(u.UserID)} disabled={u.UserID === user.UserID}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {editingUser && (
            <div ref={editUserPanelRef} style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #aaa", background: "#f9f9f9" }}>
              <h3>Edit User: {editingUser.FirstName} {editingUser.LastName} (ID: {editingUser.UserID})</h3>
              <form onSubmit={handleSaveUser} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  placeholder="First Name"
                  value={editUserForm.FirstName}
                  onChange={e => setEditUserForm({ ...editUserForm, FirstName: e.target.value })}
                  required
                />
                <input
                  placeholder="Last Name"
                  value={editUserForm.LastName}
                  onChange={e => setEditUserForm({ ...editUserForm, LastName: e.target.value })}
                  required
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={editUserForm.Email}
                  onChange={e => setEditUserForm({ ...editUserForm, Email: e.target.value })}
                  required
                />
                {editingUser.UserType !== 2 ? (
                  <select
                    value={editUserForm.UserType}
                    onChange={e => setEditUserForm({ ...editUserForm, UserType: e.target.value })}
                  >
                    <option value={0}>Student</option>
                    <option value={1}>Faculty</option>
                  </select>
                ) : (
                  <span style={{ alignSelf: "center" }}>Type: Librarian</span>
                )}
                <select
                  value={editUserForm.Status}
                  onChange={e => setEditUserForm({ ...editUserForm, Status: e.target.value })}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Blocked</option>
                </select>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}