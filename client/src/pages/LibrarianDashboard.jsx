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
  const [analyticsFilters, setAnalyticsFilters] = useState({
    startDate: "", endDate: "", category: "", itemType: ""
  });
  const [analyticsResults, setAnalyticsResults] = useState([]);
  const [analyticsSort, setAnalyticsSort] = useState({ key: "CheckoutCount", dir: "desc" });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsHasRun, setAnalyticsHasRun] = useState(false);
  const [analyticsAppliedFilters, setAnalyticsAppliedFilters] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [overviewStats, setOverviewStats] = useState(null);
  const [loansTab, setLoansTab] = useState("active");
  const [activeLoans, setActiveLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [fineSearch, setFineSearch] = useState("");
  const [finesFilter, setFinesFilter] = useState("all");

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
    if (view === "home") {
      fetchOverviewStats();
    }
    if (view === "loans") {
      fetchActiveLoans();
      if (users.length === 0) fetchUsersQuiet();
    }
    if (view === "fines") {
      fetchFines("all");
      if (users.length === 0) fetchUsersQuiet();
    }
    if (view === "analytics") {
      if (!analyticsSummary) {
        fetch("http://localhost:3000/api/librarian/analytics/summary", { credentials: "include" })
          .then(r => r.json())
          .then(data => { if (!data.error) setAnalyticsSummary(data); })
          .catch(() => {});
      }
      if (!analyticsHasRun) {
        fetchAnalytics();
      }
    }
  }, [view]);

  async function fetchActiveLoans() {
    setLoansLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/librarian/loans/active", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setActiveLoans(data);
    } catch {
      // table stays empty on failure
    } finally {
      setLoansLoading(false);
    }
  }

  async function fetchFines(filter) {
    const endpointMap = { all: "/api/librarian/fines", paid: "/api/librarian/fines/paid", unpaid: "/api/librarian/fines/unpaid" };
    try {
      const res = await fetch(`http://localhost:3000${endpointMap[filter]}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setFines(data);
    } catch {
      // table stays empty on failure
    }
  }

  async function fetchOverdueLoans() {
    setLoansLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/librarian/loans/overdue", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setOverdueLoans(data);
    } catch {
      // table stays empty on failure
    } finally {
      setLoansLoading(false);
    }
  }

  async function fetchOverviewStats() {
    try {
      const res = await fetch("http://localhost:3000/api/librarian/overview/stats", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setOverviewStats(data);
    } catch {
      // cards show "—" on failure
    }
  }

  useEffect(() => {
    async function checkAccess() {
      const res = await fetch("http://localhost:3000/api/me", { credentials: "include" });
      const data = await res.json();
      if (!res.ok || data.user?.UserType !== 2) {
        navigate("/login");
      } else {
        setUser(data.user);
        fetchOverviewStats();
      }
    }
    checkAccess();
  }, []);

  async function fetchUsersQuiet() {
    try {
      const res = await fetch("http://localhost:3000/api/librarian/users", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch {
      // names fall back to "#id" if this fails
    }
  }

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


  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (analyticsFilters.startDate) params.set("startDate", analyticsFilters.startDate);
      if (analyticsFilters.endDate)   params.set("endDate",   analyticsFilters.endDate);
      if (analyticsFilters.category)  params.set("category",  analyticsFilters.category);
      if (analyticsFilters.itemType)  params.set("itemType",  analyticsFilters.itemType);
      const res = await fetch(
        `http://localhost:3000/api/librarian/analytics/most-checked-out?${params}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAnalyticsResults(data);
      setAnalyticsHasRun(true);
      setAnalyticsAppliedFilters({ ...analyticsFilters });
      setView("analytics");
    } catch {
      setError("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
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

  const userNameById = (id) => {
    if (!id) return "—";
    const u = users.find(u => u.UserID === id);
    return u ? `${u.FirstName} ${u.LastName} (#${id})` : `#${id}`;
  };

  const userTypeLabel = (type) => {
    if (type === 0) return "Student";
    if (type === 1) return "Faculty";
    if (type === 2) return "Librarian";
    return "Unknown";
  };

  return (
    <div className="librarian-dashboard" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Librarian Dashboard</h1>
        <div>
          <span style={{ marginRight: "1rem" }}>Welcome, {user.FirstName} {user.LastName}</span>
          <button onClick={() => navigate("/")} style={{ marginRight: "0.5rem" }}>Student View</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      <nav style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid #ccc", paddingBottom: "0.75rem" }}>
        {[
          { label: "Overview",  key: "home",      action: () => setView("home") },
          { label: "Users",     key: "users",     action: fetchUsers },
          { label: "Catalog",   key: "catalog",   action: fetchCatalog },
          { label: "Loans",     key: "loans",     action: () => setView("loans") },
          { label: "Fines",     key: "fines",     action: () => setView("fines") },
          { label: "Analytics", key: "analytics", action: () => setView("analytics") },
        ].map(({ label, key, action }) => (
          <button key={key} onClick={action} style={{ fontWeight: view === key ? "bold" : "normal" }}>
            {label}
          </button>
        ))}
      </nav>

      {view === "home" && (
        <div>
          <h2>Overview</h2>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            {[
              { label: "Total Users",      value: overviewStats?.TotalUsers,    subtitle: "registered accounts" },
              { label: "Active Loans",     value: overviewStats?.ActiveLoans,   subtitle: "items currently checked out" },
              { label: "Overdue Loans",    value: overviewStats?.OverdueLoans,  subtitle: "items past due date" },
              { label: "Total Fines Owed", value: overviewStats?.TotalFinesOwed != null ? `$${Number(overviewStats.TotalFinesOwed).toFixed(2)}` : null, subtitle: "unpaid balance" },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "1rem 1.25rem", minWidth: "160px", flex: "1 1 160px", background: "#f9f9f9" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>{card.label}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.25rem" }}>{card.value ?? "—"}</div>
                <div style={{ fontSize: "0.75rem", color: "#999" }}>{card.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "catalog" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
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

      {view === "analytics" && (() => {
        const typeOptions = {
          "1": [{ v: 1, l: "Book" }, { v: 2, l: "Textbook" }, { v: 3, l: "Magazine" }, { v: 4, l: "Audiobook" }],
          "2": [{ v: 1, l: "DVD/CD" }, { v: 2, l: "Blu-ray" }, { v: 3, l: "Vinyl" }],
          "3": [{ v: 1, l: "Laptop" }, { v: 2, l: "Tablet" }, { v: 3, l: "Calculator" }],
        };

        const displaySummary = analyticsHasRun && analyticsResults.length > 0
          ? (() => {
              const total  = analyticsResults.reduce((s, r) => s + r.CheckoutCount, 0);
              const wDays  = analyticsResults.reduce((s, r) => r.AvgLoanDays != null ? s + r.AvgLoanDays * r.CheckoutCount : s, 0);
              const wCount = analyticsResults.reduce((s, r) => r.AvgLoanDays != null ? s + r.CheckoutCount : s, 0);
              return {
                TotalCheckouts:        total,
                UniqueItemsCheckedOut: analyticsResults.length,
                CurrentlyCheckedOut:   analyticsResults.reduce((s, r) => s + r.CurrentlyCheckedOut, 0),
                OverdueItems:          analyticsResults.reduce((s, r) => s + r.OverdueCount, 0),
                TopType:               analyticsResults[0]?.TypeLabel ?? null,
                TopItemTitle:          analyticsResults[0]?.Title ?? null,
                AvgLoanDays:           wCount > 0 ? Math.round(wDays / wCount * 10) / 10 : null,
              };
            })()
          : analyticsSummary;

        const sorted = [...analyticsResults].sort((a, b) => {
          const dir = analyticsSort.dir === "asc" ? 1 : -1;
          if (analyticsSort.key === "CheckoutCount") return dir * (a.CheckoutCount - b.CheckoutCount);
          if (analyticsSort.key === "Title") return dir * a.Title.localeCompare(b.Title);
          if (analyticsSort.key === "TypeLabel") return dir * a.TypeLabel.localeCompare(b.TypeLabel);
          if (analyticsSort.key === "AvgLoanDays") return dir * ((a.AvgLoanDays ?? -1) - (b.AvgLoanDays ?? -1));
          if (analyticsSort.key === "OverdueCount") return dir * (a.OverdueCount - b.OverdueCount);
          return 0;
        });

        function toggleSort(key) {
          setAnalyticsSort(prev =>
            prev.key === key
              ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
              : { key, dir: "desc" }
          );
        }

        function sortIndicator(key) {
          if (analyticsSort.key !== key) return " ↕";
          return analyticsSort.dir === "desc" ? " ↓" : " ↑";
        }

        return (
          <div>
            <h2>Checkout Analytics</h2>

            {/* Summary cards */}
            {displaySummary && (() => {
              const cards = [
                { label: "Total Checkouts",          value: displaySummary.TotalCheckouts },
                { label: "Unique Items Checked Out", value: displaySummary.UniqueItemsCheckedOut },
                { label: "Currently Checked Out",    value: displaySummary.CurrentlyCheckedOut },
                { label: "Overdue",                  value: displaySummary.OverdueItems },
                { label: "Top Type",                 value: displaySummary.TopType },
                { label: "Most Checked Out Item",    value: displaySummary.TopItemTitle },
                { label: "Avg Loan Duration",        value: displaySummary.AvgLoanDays != null ? `${displaySummary.AvgLoanDays} days` : "—" },
              ];
              return (
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  {cards.map(card => (
                    <div key={card.label} style={{
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "0.75rem 1rem",
                      minWidth: "130px",
                      flex: "1 1 130px",
                      background: "#f9f9f9"
                    }}>
                      <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>{card.label}</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{card.value ?? "—"}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Start Date</label>
                <input
                  type="date"
                  value={analyticsFilters.startDate}
                  onChange={e => setAnalyticsFilters({ ...analyticsFilters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>End Date</label>
                <input
                  type="date"
                  value={analyticsFilters.endDate}
                  onChange={e => setAnalyticsFilters({ ...analyticsFilters, endDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Category</label>
                <select
                  value={analyticsFilters.category}
                  onChange={e => setAnalyticsFilters({ ...analyticsFilters, category: e.target.value, itemType: "" })}
                >
                  <option value="">All</option>
                  <option value="1">Literature</option>
                  <option value="2">Media</option>
                  <option value="3">Devices</option>
                </select>
              </div>
              {analyticsFilters.category && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Type</label>
                  <select
                    value={analyticsFilters.itemType}
                    onChange={e => setAnalyticsFilters({ ...analyticsFilters, itemType: e.target.value })}
                  >
                    <option value="">All</option>
                    {(typeOptions[analyticsFilters.category] || []).map(o => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={fetchAnalytics} disabled={analyticsLoading}>
                {analyticsLoading ? "Loading…" : "Run Report"}
              </button>
              {(analyticsFilters.startDate || analyticsFilters.endDate || analyticsFilters.category) && (
                <button
                  onClick={() => setAnalyticsFilters({ startDate: "", endDate: "", category: "", itemType: "" })}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results */}
            {!analyticsHasRun && !analyticsLoading && (
              <p style={{ color: "#666" }}>Set filters above and click Run Report to see results.</p>
            )}
            {analyticsHasRun && !analyticsLoading && analyticsResults.length === 0 && (
              <p style={{ color: "#666" }}>No results found for the selected filters.</p>
            )}
            {analyticsResults.length > 0 && (
              <>
                {analyticsAppliedFilters && (
                  <p style={{ marginBottom: "0.25rem", color: "#555" }}>
                    <strong>Date range:</strong>{" "}
                    {analyticsAppliedFilters.startDate || analyticsAppliedFilters.endDate
                      ? `${analyticsAppliedFilters.startDate || "—"} to ${analyticsAppliedFilters.endDate || "—"}`
                      : "All time"}
                  </p>
                )}
                <p style={{ marginBottom: "0.5rem", color: "#555" }}>{sorted.length} item{sorted.length !== 1 ? "s" : ""} — click a column header to sort</p>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "3rem" }}>#</th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("Title")}>
                        Title{sortIndicator("Title")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("TypeLabel")}>
                        Type{sortIndicator("TypeLabel")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("CheckoutCount")}>
                        Checkouts{sortIndicator("CheckoutCount")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("AvgLoanDays")}>
                        Avg Loan Duration{sortIndicator("AvgLoanDays")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("OverdueCount")}>
                        Overdue{sortIndicator("OverdueCount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, idx) => (
                      <tr key={row.ItemID}>
                        <td>{idx + 1}</td>
                        <td>{row.Title}</td>
                        <td>{row.TypeLabel}</td>
                        <td>{row.CheckoutCount}</td>
                        <td>{row.AvgLoanDays != null ? `${row.AvgLoanDays} days` : "—"}</td>
                        <td>{row.OverdueCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      })()}

      {view === "loans" && (
        <div>
          <h2>Loans</h2>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => { setLoansTab("active"); fetchActiveLoans(); }}
              style={{ fontWeight: loansTab === "active" ? "bold" : "normal" }}
            >
              Active
            </button>
            <button
              onClick={() => { setLoansTab("overdue"); fetchOverdueLoans(); }}
              style={{ fontWeight: loansTab === "overdue" ? "bold" : "normal" }}
            >
              Overdue
            </button>
          </div>

          {loansTab === "active" && (
            loansLoading ? (
              <p>Loading...</p>
            ) : activeLoans.length === 0 ? (
              <p>No active loans.</p>
            ) : (
              <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>User ID</th>
                    <th>User Name</th>
                    <th>Copy ID</th>
                    <th>Item ID</th>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Created At</th>
                    <th>Created By</th>
                    <th>Updated At</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map(loan => (
                    <tr key={loan.LoanID}>
                      <td>{loan.LoanID}</td>
                      <td>{loan.UserID}</td>
                      <td>{loan.UserName}</td>
                      <td>{loan.CopyID}</td>
                      <td>{loan.ItemID}</td>
                      <td>{loan.Title}</td>
                      <td>{loan.DueDate ? new Date(loan.DueDate).toLocaleDateString() : "—"}</td>
                      <td>{loan.CreatedAt ? new Date(loan.CreatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.CreatedBy)}</td>
                      <td>{loan.UpdatedAt ? new Date(loan.UpdatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.UpdatedBy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {loansTab === "overdue" && (
            loansLoading ? (
              <p>Loading...</p>
            ) : overdueLoans.length === 0 ? (
              <p>No overdue loans.</p>
            ) : (
              <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>User ID</th>
                    <th>User Name</th>
                    <th>Copy ID</th>
                    <th>Item ID</th>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Created At</th>
                    <th>Created By</th>
                    <th>Updated At</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueLoans.map(loan => (
                    <tr key={loan.LoanID}>
                      <td>{loan.LoanID}</td>
                      <td>{loan.UserID}</td>
                      <td>{loan.UserName}</td>
                      <td>{loan.CopyID}</td>
                      <td>{loan.ItemID}</td>
                      <td>{loan.Title}</td>
                      <td>{loan.DueDate ? new Date(loan.DueDate).toLocaleDateString() : "—"}</td>
                      <td>{loan.CreatedAt ? new Date(loan.CreatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.CreatedBy)}</td>
                      <td>{loan.UpdatedAt ? new Date(loan.UpdatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.UpdatedBy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}

      {view === "fines" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
            <label htmlFor="fines-filter" style={{ fontWeight: "bold" }}>Show:</label>
            <select
              id="fines-filter"
              value={finesFilter}
              onChange={e => {
                const f = e.target.value;
                setFinesFilter(f);
                setFineSearch("");
                fetchFines(f);
              }}
            >
              <option value="all">All Fines</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <input
            placeholder="Search by fine ID, borrower, or loan ID..."
            value={fineSearch}
            onChange={e => setFineSearch(e.target.value)}
            style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
          />
          <h2>Fines ({fines.filter(f =>
            `${f.FineID} ${f.UserName} ${f.UserID} ${f.LoanID}`.toLowerCase().includes(fineSearch.toLowerCase())
          ).length})</h2>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: "0.5rem" }}>
            <thead>
              <tr>
                <th>Fine ID</th>
                <th>Borrower</th>
                <th>User ID</th>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Paid At</th>
                <th>Created At</th>
                <th>Created By</th>
                <th>Updated At</th>
                <th>Updated By</th>
              </tr>
            </thead>
            <tbody>
              {fines.filter(f =>
                `${f.FineID} ${f.UserName} ${f.UserID} ${f.LoanID}`.toLowerCase().includes(fineSearch.toLowerCase())
              ).map(f => (
                <tr key={f.FineID}>
                  <td>{f.FineID}</td>
                  <td>{f.UserName}</td>
                  <td>{f.UserID}</td>
                  <td>{f.LoanID}</td>
                  <td>${Number(f.FineAmount).toFixed(2)}</td>
                  <td>{f.PaidStatus === 1 ? "Yes" : "No"}</td>
                  <td>{f.PaidAt ? new Date(f.PaidAt).toLocaleString() : "—"}</td>
                  <td>{f.CreatedAt ? new Date(f.CreatedAt).toLocaleString() : "—"}</td>
                  <td>{userNameById(f.CreatedBy)}</td>
                  <td>{f.UpdatedAt ? new Date(f.UpdatedAt).toLocaleString() : "—"}</td>
                  <td>{userNameById(f.UpdatedBy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "users" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
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
                <th>Created At</th>
                <th>Created By</th>
                <th>Updated At</th>
                <th>Updated By</th>
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
                  <td>{u.CreatedAt ? new Date(u.CreatedAt).toLocaleString() : "—"}</td>
                  <td>{userNameById(u.CreatedBy)}</td>
                  <td>{u.UpdatedAt ? new Date(u.UpdatedAt).toLocaleString() : "—"}</td>
                  <td>{userNameById(u.UpdatedBy)}</td>
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