import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

const LITERATURE_GENRES = [
  { value: 0, label: "Unspecified / Other" },
  { value: 1, label: "Classic" },
  { value: 2, label: "Historical Fiction" },
  { value: 3, label: "Fantasy" },
  { value: 4, label: "Science Fiction / Dystopian" },
  { value: 5, label: "Mystery / Thriller" },
  { value: 6, label: "Romance" },
  { value: 7, label: "Literary / Contemporary" },
  { value: 8, label: "Philosophy / Existential" },
  { value: 9, label: "Adventure" },
  { value: 10, label: "Science / Technology" },
  { value: 11, label: "Business / Economics" },
  { value: 12, label: "Politics / Current Affairs" },
  { value: 13, label: "Biography / Memoir" },
  { value: 14, label: "Arts / Culture" },
  { value: 15, label: "Horror / Gothic" },
];

const MEDIA_GENRES = [
  { value: 0, label: "Unspecified / Other" },
  { value: 1, label: "Drama" },
  { value: 2, label: "Crime / Noir" },
  { value: 3, label: "Action / Adventure" },
  { value: 4, label: "Science Fiction / Fantasy" },
  { value: 5, label: "Thriller / Mystery" },
  { value: 6, label: "Comedy" },
  { value: 7, label: "Romance" },
  { value: 8, label: "Documentary / Biography" },
  { value: 9, label: "Horror" },
  { value: 10, label: "Rock / Alternative" },
  { value: 11, label: "Pop" },
  { value: 12, label: "Hip-Hop / Rap" },
  { value: 13, label: "R&B / Soul / Funk" },
  { value: 14, label: "Folk / Country" },
  { value: 15, label: "Jazz / Blues" },
  { value: 16, label: "Classical / Soundtrack" },
];

function getGenreLabel(options, value, fallback) {
  return (
    options.find((option) => option.value === Number(value))?.label ||
    fallback ||
    "Unspecified / Other"
  );
}

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
  const [loanSearch, setloanSearch] = useState("");
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
  const [analyticsTab, setAnalyticsTab] = useState("checkouts");
  const [txFilters, setTxFilters] = useState({ startDate: "", endDate: "", userId: "", type: "" });
  const [txResults, setTxResults] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txHasRun, setTxHasRun] = useState(false);
  const [txSummary, setTxSummary] = useState(null);
  const [txSort, setTxSort] = useState({ key: "TransactionDate", dir: "desc" });
  const [txAppliedType, setTxAppliedType] = useState(null);
  const [auditFilters, setAuditFilters] = useState({ startDate: "", endDate: "", librarianId: "", tableName: "", actionType: "" });
  const [auditResults, setAuditResults] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditHasRun, setAuditHasRun] = useState(false);
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditSort, setAuditSort] = useState({ key: "LastActionAt", dir: "desc" });
  const [overviewStats, setOverviewStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loansTab, setLoansTab] = useState("active");
  const [activeLoans, setActiveLoans] = useState([]);
  const [activeHolds, setActiveHolds] = useState([]);
  const [fulfilledHolds, setFulfilledHolds] = useState([]);
  const [holdsTab, setHoldsTab] = useState("active");
  const [holdsLoading, setHoldsLoading] = useState(false);
  const [holdSearch, setHoldSearch] = useState("");
  const [loansLoading, setLoansLoading] = useState(false);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [returnedLoans, setReturnedLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [fineSearch, setFineSearch] = useState("");
  const [finesFilter, setFinesFilter] = useState("all");
  const [returnError, setReturnError] = useState("");

  const [showLitForm, setShowLitForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [litForm, setLitForm] = useState({
    ItemID: "", Title: "", ItemType: 1, Genre: 0, Author: "", Publisher: "", PublicationYear: "", Copies: 1
  });
  const [mediaForm, setMediaForm] = useState({
    Title: "", ItemType: 1, Genre: 0, Producer: "", DurationMinutes: "", Copies: 1
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
    if (view === "holds") {
      fetchActiveHolds();
    }
    if (view === "fines") {
      fetchFines("all");
      if (users.length === 0) fetchUsersQuiet();
    }
    if (view === "analytics") {
      if (!analyticsSummary) {
        fetch(`${API}/api/librarian/analytics/summary`, { credentials: "include" })
          .then(r => r.json())
          .then(data => { if (!data.error) setAnalyticsSummary(data); })
          .catch(() => {});
      }
      if (!txSummary) {
        fetch(`${API}/api/librarian/analytics/transactions/summary`, { credentials: "include" })
          .then(r => r.json())
          .then(data => { if (!data.error) setTxSummary(data); })
          .catch(() => {});
      }
      if (!analyticsHasRun) {
        fetchAnalytics();
      }
      if (!auditSummary) {
        fetch(`${API}/api/librarian/employee-audit/summary`, { credentials: "include" })
          .then(r => r.json())
          .then(data => { if (!data.error) setAuditSummary(data); })
          .catch(() => {});
      }
    }
  }, [view]);

  useEffect(() => {
    if (analyticsTab === "transactions" && !txHasRun) {
      fetchTransactionReport();
    }
    if (analyticsTab === "audit" && !auditHasRun) {
      fetchAuditReport();
    }
  }, [analyticsTab]);

  async function fetchActiveLoans() {
    setLoansLoading(true);
    try {
      const res = await fetch(`${API}/api/librarian/loans/active`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setActiveLoans(data);
    } catch {
      // table stays empty on failure
    } finally {
      setLoansLoading(false);
    }
  }

  async function fetchActiveHolds() {
    setHoldsLoading(true);
    try {
      const res = await fetch(`${API}/api/librarian/holds/active`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setActiveHolds(data);
    } catch {
      // table stays empty on failure
    } finally {
      setHoldsLoading(false);
    }
  }

  async function fetchFulfilledHolds() {
    setHoldsLoading(true);
    try {
      const res = await fetch(`${API}/api/librarian/holds/fulfilled`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setFulfilledHolds(data);
    } catch {
      // table stays empty on failure
    } finally {
      setHoldsLoading(false);
    }
  }

  async function fetchFines(filter) {
    const endpointMap = { all: "/api/librarian/fines", paid: "/api/librarian/fines/paid", unpaid: "/api/librarian/fines/unpaid" };
    try {
      const res = await fetch(`${API}${endpointMap[filter]}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setFines(data);
    } catch {
      // table stays empty on failure
    }
  }

  async function fetchOverdueLoans() {
    setLoansLoading(true);
    try {
      const res = await fetch(`${API}/api/librarian/loans/overdue`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setOverdueLoans(data);
    } catch {
      // table stays empty on failure
    } finally {
      setLoansLoading(false);
    }
  }

  async function fetchReturnedLoans() {
    setLoansLoading(true);
    try {
      const res = await fetch(`${API}/api/librarian/loans/returned`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setReturnedLoans(data);
    } catch {
      // table stays empty on failure
    } finally {
      setLoansLoading(false);
    }
  }

  async function fetchOverviewStats() {
    try {
      const res = await fetch(`${API}/api/librarian/overview/stats`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setOverviewStats(data);
    } catch {
      // cards show "—" on failure
    }
    try {
      const res = await fetch(`${API}/api/librarian/overview/recent-activity`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setRecentActivity(Array.isArray(data) ? data : []);
    } catch {
      // feed stays empty on failure
    }
  }

  useEffect(() => {
    async function checkAccess() {
      const res = await fetch(`${API}/api/me`, { credentials: "include" });
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
      const res = await fetch(`${API}/api/librarian/users`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch {
      // names fall back to "#id" if this fails
    }
  }

  async function fetchUsers() {
    setError("");
    try {
      const res = await fetch(`${API}/api/librarian/users`, { credentials: "include" });
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
      const res = await fetch(`${API}/api/librarian/users`, {
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
      const res = await fetch(`${API}/api/librarian/users/${editingUser.UserID}`, {
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
      const res = await fetch(`${API}/api/librarian/users/${userId}`, {
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
      Genre: item.Genre ?? 0,
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
      const res = await fetch(`${API}/api/librarian/catalog/literature/${editingLit.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Title: editLitForm.Title,
          ItemType: Number(editLitForm.ItemType),
          Genre: Number(editLitForm.Genre) || 0,
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
      const res = await fetch(`${API}/api/librarian/catalog/literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...litForm,
          ItemID: Number(litForm.ItemID),
          ItemType: Number(litForm.ItemType),
          Genre: Number(litForm.Genre) || 0,
          PublicationYear: litForm.PublicationYear ? Number(litForm.PublicationYear) : null,
          Copies: Number(litForm.Copies)
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setLitForm({ ItemID: "", Title: "", ItemType: 1, Genre: 0, Author: "", Publisher: "", PublicationYear: "", Copies: 1 });
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
        const res = await fetch(`${API}/api/literature`);
        const data = await res.json();
        setLiterature(Array.isArray(data[0]) ? data[0] : data);
      } else if (catalogTab === "media") {
        const res = await fetch(`${API}/api/media`);
        const data = await res.json();
        setMedia(Array.isArray(data[0]) ? data[0] : data);
      } else if (catalogTab === "devices") {
        const res = await fetch(`${API}/api/devices`);
        const data = await res.json();
        setDevices(Array.isArray(data[0]) ? data[0] : data);
      }
    } catch {
      setError("Failed to refresh catalog");
    }
  }

  async function loadCopies(item) {
    try {
      const res = await fetch(`${API}/api/librarian/catalog/${item.ItemID}/copies`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/copies`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/copies/${copyId}`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/devices`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/devices/${itemId}`, {
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
      Genre: item.Genre ?? 0,
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
      const res = await fetch(`${API}/api/librarian/catalog/media/${editingMedia.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          Title: editMediaForm.Title,
          ItemType: Number(editMediaForm.ItemType),
          Genre: Number(editMediaForm.Genre) || 0,
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
      const res = await fetch(`${API}/api/librarian/catalog/devices/${editingDevice.ItemID}`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...mediaForm,
          ItemType: Number(mediaForm.ItemType),
          Genre: Number(mediaForm.Genre) || 0,
          DurationMinutes: mediaForm.DurationMinutes ? Number(mediaForm.DurationMinutes) : null,
          Copies: Number(mediaForm.Copies)
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMediaForm({ Title: "", ItemType: 1, Genre: 0, Producer: "", DurationMinutes: "", Copies: 1 });
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
      const res = await fetch(`${API}/api/librarian/catalog/media/${itemId}`, {
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
      const res = await fetch(`${API}/api/librarian/catalog/literature/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to delete literature"); return; }
      fetchCatalog();
    } catch {
      alert("Failed to delete literature");
    }
  }

    async function fetchCatalog() {
    try {
      const res = await fetch(`${API}/api/literature`);
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
      const res = await fetch(`${API}/api/media`);
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
      const res = await fetch(`${API}/api/devices`);
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
        `${API}/api/librarian/analytics/most-checked-out?${params}`,
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

  async function fetchTransactionReport() {
    setTxLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (txFilters.startDate) params.set("startDate", txFilters.startDate);
      if (txFilters.endDate)   params.set("endDate",   txFilters.endDate);
      if (txFilters.userId)    params.set("userId",    txFilters.userId);
      if (txFilters.type)      params.set("type",      txFilters.type);
      const res = await fetch(
        `${API}/api/librarian/analytics/transactions/report?${params}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTxResults(data);
      setTxHasRun(true);
      setTxAppliedType(txFilters.type);
    } catch {
      setError("Failed to load transaction report");
    } finally {
      setTxLoading(false);
    }
  }

  async function fetchAuditReport() {
    setAuditLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (auditFilters.startDate)   params.set("startDate",   auditFilters.startDate);
      if (auditFilters.endDate)     params.set("endDate",     auditFilters.endDate);
      if (auditFilters.librarianId) params.set("librarianId", auditFilters.librarianId);
      if (auditFilters.tableName)   params.set("tableName",   auditFilters.tableName);
      if (auditFilters.actionType)  params.set("actionType",  auditFilters.actionType);
      const res = await fetch(
        `${API}/api/librarian/employee-audit/report?${params}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAuditResults(data);
      setAuditHasRun(true);
    } catch {
      setError("Failed to load employee audit report");
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleReturn(loanId) {
    const isOverdue = loansTab === "overdue";
    const msg = isOverdue
      ? `Return loan #${loanId}? This item is overdue — fine accrual will stop once returned.`
      : `Return loan #${loanId}?`;
    if (!confirm(msg)) return;
    setReturnError("");
    try {
      const res = await fetch(`${API}/api/loans/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ loanId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to return item");
      if (loansTab === "active") await fetchActiveLoans();
      else await fetchOverdueLoans();
      fetchOverviewStats();
    } catch (err) {
      setReturnError(err.message);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API}/api/logout`, {
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
      <div style={{
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}>
        <img
          src="/CougarCommonsBanner.png"
          alt="Cougar Commons"
          style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h1 style={{ margin: 0, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)", fontWeight: "800", letterSpacing: "0.01em", fontSize: "2.25rem" }}>Librarian Dashboard</h1>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "#fff", fontSize: "0.85rem", textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>Logged in as "{user.FirstName} {user.LastName}"</span>
              <button onClick={() => navigate("/")} style={{ fontSize: "0.8rem" }}>Student View</button>
              <button onClick={handleLogout} style={{ fontSize: "0.8rem" }}>Logout</button>
            </div>
          </div>
          <nav style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { label: "Overview",  key: "home",      action: () => setView("home") },
              { label: "Users",     key: "users",     action: fetchUsers },
              { label: "Catalog",   key: "catalog",   action: fetchCatalog },
              { label: "Loans",     key: "loans",     action: () => setView("loans") },
              { label: "Holds",     key: "holds",     action: () => setView("holds") },
              { label: "Fines",     key: "fines",     action: () => setView("fines") },
              { label: "Analytics", key: "analytics", action: () => setView("analytics") },
            ].map(({ label, key, action }) => (
              <button key={key} onClick={action} style={{
                fontWeight: view === key ? "bold" : "normal",
                background: view === key ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "4px",
                padding: "0.3rem 0.75rem",
                cursor: "pointer",
                fontSize: "0.85rem",
                backdropFilter: "blur(4px)",
              }}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

      {view === "home" && (
        <div>
          {/* Welcome card */}
          <div style={{ background: "#f0f4ff", border: "1px solid #d0d8f0", borderRadius: "6px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.05rem" }}>Welcome back, {user.FirstName}!</div>
              <div style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.25rem" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
            {overviewStats?.OverdueLoans > 0 && (
              <div style={{ background: "#fff3f3", border: "1px solid #f5c6c6", borderRadius: "4px", padding: "0.5rem 0.9rem", fontSize: "0.85rem", color: "#c0392b" }}>
                ⚠ {overviewStats.OverdueLoans} overdue loan{overviewStats.OverdueLoans !== 1 ? "s" : ""} need attention
              </div>
            )}
          </div>

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

          {/* Recent activity feed */}
          {recentActivity.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ marginBottom: "0.75rem", fontSize: "0.95rem", color: "#444" }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recentActivity.map((row, idx) => {
                  const statusColor = row.StatusLabel === "Overdue" ? "#c0392b" : row.StatusLabel === "Returned" ? "#27ae60" : "#2980b9";
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.9rem", background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: "4px", flexWrap: "wrap", gap: "0.4rem" }}>
                      <div style={{ fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: "500" }}>{row.UserName}</span>
                        <span style={{ color: "#888", margin: "0 0.4rem" }}>—</span>
                        <span>{row.Title}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.8rem" }}>
                        <span style={{ color: statusColor, fontWeight: "500" }}>{row.StatusLabel}</span>
                        <span style={{ color: "#aaa" }}>{new Date(row.ActivityAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                  <select value={litForm.Genre} onChange={e => setLitForm({ ...litForm, Genre: Number(e.target.value) })}>
                    {LITERATURE_GENRES.map((genre) => (
                      <option key={genre.value} value={genre.value}>{genre.label}</option>
                    ))}
                  </select>
                  <input placeholder="Author *" value={litForm.Author} onChange={e => setLitForm({ ...litForm, Author: e.target.value })} />
                  <input placeholder="Publisher" value={litForm.Publisher} onChange={e => setLitForm({ ...litForm, Publisher: e.target.value })} />
                  <input placeholder="Publication Year" type="number" value={litForm.PublicationYear} onChange={e => setLitForm({ ...litForm, PublicationYear: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={litForm.Copies} onChange={e => setLitForm({ ...litForm, Copies: e.target.value })} />
                  <button type="submit">Add</button>
                </form>
              )}

              <input
                placeholder="Search by title, author, or genre..."
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
              <h2>Books ({literature.length})</h2>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>ISBN</th><th>Title</th><th>Type</th><th>Genre</th><th>Publisher</th>
            <th>Author</th><th>Year</th><th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {literature.filter(l =>
            `${l.Title} ${l.Author} ${l.GenreName ?? ""}`.toLowerCase().includes(bookSearch.toLowerCase())
          ).map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Title}</td>
              <td>{["", "Book", "Textbook", "Magazine", "Audiobook"][item.ItemType] ?? "—"}</td>
              <td>{item.GenreName ?? getGenreLabel(LITERATURE_GENRES, item.Genre)}</td>
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
                <select
                  value={editLitForm.Genre}
                  onChange={e => setEditLitForm({ ...editLitForm, Genre: Number(e.target.value) })}
                >
                  {LITERATURE_GENRES.map((genre) => (
                    <option key={genre.value} value={genre.value}>{genre.label}</option>
                  ))}
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
                  <select value={mediaForm.Genre} onChange={e => setMediaForm({ ...mediaForm, Genre: Number(e.target.value) })}>
                    {MEDIA_GENRES.map((genre) => (
                      <option key={genre.value} value={genre.value}>{genre.label}</option>
                    ))}
                  </select>
                  <input placeholder="Producer" value={mediaForm.Producer} onChange={e => setMediaForm({ ...mediaForm, Producer: e.target.value })} />
                  <input placeholder="Duration (minutes)" type="number" min="1" value={mediaForm.DurationMinutes} onChange={e => setMediaForm({ ...mediaForm, DurationMinutes: e.target.value })} />
                  <input placeholder="Copies *" type="number" min="1" value={mediaForm.Copies} onChange={e => setMediaForm({ ...mediaForm, Copies: e.target.value })} />
                  <button type="submit">Add</button>
                </form>
              )}

              <input
                placeholder="Search by ID, name, or genre..."
                value={mediaSearch}
                onChange={e => setMediaSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
              <h2>Media ({media.length})</h2>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Device ID</th><th>Name</th><th>Type</th><th>Genre</th><th>Producer</th><th>Duration</th>
            <th>Available</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {media.filter(m =>
            `${m.ItemID} ${m.Title} ${m.GenreName ?? ""}`.toLowerCase().includes(mediaSearch.toLowerCase())
          ).map(item => (
            <tr key={item.ItemID}>
              <td>{item.ItemID}</td>
              <td>{item.Title}</td>
              <td>{["", "DVD/CD", "Blu-ray", "Vinyl"][item.ItemType] ?? "—"}</td>
              <td>{item.GenreName ?? getGenreLabel(MEDIA_GENRES, item.Genre)}</td>
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
                <select
                  value={editMediaForm.Genre}
                  onChange={e => setEditMediaForm({ ...editMediaForm, Genre: Number(e.target.value) })}
                >
                  {MEDIA_GENRES.map((genre) => (
                    <option key={genre.value} value={genre.value}>{genre.label}</option>
                  ))}
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
                CheckoutsThisWeek:     analyticsSummary?.CheckoutsThisWeek ?? null,
                CheckoutsLastWeek:     analyticsSummary?.CheckoutsLastWeek ?? null,
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

        // Transaction report sort helpers
        function toggleTxSort(key) {
          setTxSort(prev =>
            prev.key === key
              ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
              : { key, dir: "desc" }
          );
        }
        function txSortIndicator(key) {
          if (txSort.key !== key) return " ↕";
          return txSort.dir === "desc" ? " ↓" : " ↑";
        }
        const txSorted = [...txResults].sort((a, b) => {
          const dir = txSort.dir === "asc" ? 1 : -1;
          if (txSort.key === "TransactionDate") return dir * (new Date(a.TransactionDate) - new Date(b.TransactionDate));
          if (txSort.key === "TransactionType") return dir * a.TransactionType.localeCompare(b.TransactionType);
          if (txSort.key === "UserName") return dir * a.UserName.localeCompare(b.UserName);
          if (txSort.key === "Title") return dir * (a.Title ?? "").localeCompare(b.Title ?? "");
          if (txSort.key === "StatusLabel") return dir * (a.StatusLabel ?? "").localeCompare(b.StatusLabel ?? "");
          if (txSort.key === "AgeDays") return dir * ((a.AgeDays ?? 0) - (b.AgeDays ?? 0));
          if (txSort.key === "DaysOverdue") return dir * ((a.DaysOverdue ?? 0) - (b.DaysOverdue ?? 0));
          if (txSort.key === "FineAmount") return dir * ((a.FineAmount ?? 0) - (b.FineAmount ?? 0));
          return 0;
        });

        return (
          <div>
            <h2>Analytics</h2>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setAnalyticsTab("checkouts")}
                style={{ fontWeight: analyticsTab === "checkouts" ? "bold" : "normal" }}
              >
                Most Checkouts
              </button>
              <button
                onClick={() => setAnalyticsTab("transactions")}
                style={{ fontWeight: analyticsTab === "transactions" ? "bold" : "normal" }}
              >
                Transaction Report
              </button>
              <button
                onClick={() => setAnalyticsTab("audit")}
                style={{ fontWeight: analyticsTab === "audit" ? "bold" : "normal" }}
              >
                Employee Audit
              </button>
            </div>

            {analyticsTab === "transactions" && (() => {
              const computedSummary = txHasRun && txResults.length > 0 ? (() => {
                const loans = txResults.filter(r => r.TransactionType === "Loan");
                const holds = txResults.filter(r => r.TransactionType === "Hold");
                const fines = txResults.filter(r => r.TransactionType === "Fine");
                const completedLoans = loans.filter(r => r.ReturnDate);
                const avgLoanDays = completedLoans.length > 0
                  ? Math.round(completedLoans.reduce((s, r) => s + (r.AgeDays ?? 0), 0) / completedLoans.length * 10) / 10
                  : null;
                const avgHoldDays = holds.length > 0
                  ? Math.round(holds.reduce((s, r) => s + (r.AgeDays ?? 0), 0) / holds.length * 10) / 10
                  : null;
                const unpaidFines = fines.filter(r => r.StatusLabel === "Unpaid");
                const paidFinesWithPayDays = fines.filter(r => r.StatusLabel === "Paid" && r.DaysToPayFine != null);
                const avgPayDays = paidFinesWithPayDays.length > 0
                  ? Math.round(paidFinesWithPayDays.reduce((s, r) => s + Number(r.DaysToPayFine), 0) / paidFinesWithPayDays.length * 10) / 10
                  : null;
                return {
                  OverdueLoans: loans.filter(r => r.StatusLabel === "Overdue").length,
                  TotalHolds: holds.length,
                  ActiveHolds: holds.filter(r => r.StatusLabel === "Active").length,
                  UnpaidFines: unpaidFines.length,
                  TotalOutstandingFineAmount: unpaidFines.reduce((s, r) => s + Number(r.FineAmount ?? 0), 0),
                  AvgCompletedLoanDays: avgLoanDays,
                  AvgHoldLifecycleDays: avgHoldDays,
                  AvgDaysToPayFine: avgPayDays,
                };
              })() : (() => {
                if (!txSummary) return null;
                return { ...txSummary, AvgDaysToPayFine: null };
              })();
              const s = computedSummary;
              const txCards = s ? [
                { label: "Overdue Loans",        value: s.OverdueLoans },
                { label: "Total Holds",          value: s.TotalHolds },
                { label: "Active Holds",         value: s.ActiveHolds },
                { label: "Unpaid Fines",         value: s.UnpaidFines },
                { label: "Outstanding Fines",    value: s.TotalOutstandingFineAmount != null ? `$${Number(s.TotalOutstandingFineAmount).toFixed(2)}` : "—" },
                { label: "Avg Loan Duration",    value: s.AvgCompletedLoanDays != null ? `${s.AvgCompletedLoanDays} days` : "—" },
                { label: "Avg Hold Lifecycle",   value: s.AvgHoldLifecycleDays != null ? `${s.AvgHoldLifecycleDays} days` : "—" },
                { label: "Avg Days to Pay Fine", value: s.AvgDaysToPayFine != null ? `${s.AvgDaysToPayFine} days` : "—" },
              ] : [];
              return (
                <>
                  {txCards.length > 0 && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                      {txCards.map(card => (
                        <div key={card.label} style={{
                          border: "1px solid #ccc", borderRadius: "4px",
                          padding: "0.75rem 1rem", minWidth: "130px", flex: "1 1 130px", background: "#f9f9f9"
                        }}>
                          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>{card.label}</div>
                          <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{card.value ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tables used */}
                  {(!txHasRun || txResults.length > 0) && (() => {
                    const t = txHasRun ? txAppliedType : "";
                    let tables = [];
                    if (!t || t === "Loan") tables.push(...["loans", "copies", "items", "users"]);
                    if (!t || t === "Hold") tables.push(...["holds", "items", "users"]);
                    if (!t || t === "Fine") tables.push(...["fines", "loans", "copies", "items", "users"]);
                    const unique = [...new Set(tables)].sort();
                    return (
                      <div style={{ marginBottom: "0.75rem", fontSize: "0.78rem", color: "#555" }}>
                        <span style={{ marginRight: "0.4rem" }}>Tables Used:</span>
                        {unique.map(tbl => (
                          <span key={tbl} style={{ display: "inline-block", background: "#eef", border: "1px solid #aac", borderRadius: "3px", padding: "1px 6px", marginRight: "4px", fontFamily: "monospace" }}>{tbl}</span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Filter bar */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Start Date</label>
                      <input type="date" value={txFilters.startDate} onChange={e => setTxFilters({ ...txFilters, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>End Date</label>
                      <input type="date" value={txFilters.endDate} onChange={e => setTxFilters({ ...txFilters, endDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>User ID</label>
                      <input type="number" placeholder="All" value={txFilters.userId} onChange={e => setTxFilters({ ...txFilters, userId: e.target.value })} style={{ width: "80px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Type</label>
                      <select value={txFilters.type} onChange={e => setTxFilters({ ...txFilters, type: e.target.value })}>
                        <option value="">All</option>
                        <option value="Loan">Loan</option>
                        <option value="Hold">Hold</option>
                        <option value="Fine">Fine</option>
                      </select>
                    </div>
                    <button onClick={fetchTransactionReport} disabled={txLoading}>
                      {txLoading ? "Loading…" : "Run Report"}
                    </button>
                    {(txFilters.startDate || txFilters.endDate || txFilters.userId || txFilters.type) && (
                      <button onClick={() => setTxFilters({ startDate: "", endDate: "", userId: "", type: "" })}>
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {!txHasRun && !txLoading && (
                    <p style={{ color: "#666" }}>Set filters above and click Run Report to see results.</p>
                  )}
                  {txHasRun && !txLoading && txResults.length === 0 && (
                    <p style={{ color: "#666" }}>No results found for the selected filters.</p>
                  )}
                  {txSorted.length > 0 && (
                    <>
                      <p style={{ marginBottom: "0.5rem", color: "#555" }}>{txSorted.length} record{txSorted.length !== 1 ? "s" : ""} — click a column header to sort</p>

                      {/* Donut charts: type split + status breakdown */}
                      {(() => {
                        const COLORS = { Loan: "#c8102e", Hold: "#4a90d9", Fine: "#e8a020", Active: "#4caf50", Overdue: "#c8102e", Returned: "#888", Fulfilled: "#4a90d9", Cancelled: "#bbb", Paid: "#4caf50", Unpaid: "#e8a020" };
                        const typeCounts = ["Loan","Hold","Fine"].map(type => ({
                          name: type, value: txSorted.filter(r => r.TransactionType === type).length
                        })).filter(d => d.value > 0);
                        const statusCounts = Object.entries(
                          txSorted.reduce((acc, r) => { acc[r.StatusLabel] = (acc[r.StatusLabel] || 0) + 1; return acc; }, {})
                        ).map(([name, value]) => ({ name, value }));
                        return (
                          <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 260px" }}>
                              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.25rem", textAlign: "center" }}>By Transaction Type</p>
                              <ResponsiveContainer width="100%" height={270}>
                                <PieChart>
                                  <Pie data={typeCounts} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {typeCounts.map((d, i) => <Cell key={i} fill={COLORS[d.name] || "#aaa"} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend iconSize={10} wrapperStyle={{ fontSize: "0.78rem", paddingTop: "8px" }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div style={{ flex: "1 1 260px" }}>
                              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.25rem", textAlign: "center" }}>By Status</p>
                              <ResponsiveContainer width="100%" height={270}>
                                <PieChart>
                                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {statusCounts.map((d, i) => <Cell key={i} fill={COLORS[d.name] || "#999"} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend iconSize={10} wrapperStyle={{ fontSize: "0.78rem", paddingTop: "8px" }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })()}

                      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                          <tr>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("TransactionType")}>Transaction Type{txSortIndicator("TransactionType")}</th>
                            <th>Loan ID</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("UserName")}>Patron Name{txSortIndicator("UserName")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("Title")}>Item Title{txSortIndicator("Title")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("TransactionDate")}>Transaction Date{txSortIndicator("TransactionDate")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("StatusLabel")}>Current Status{txSortIndicator("StatusLabel")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("AgeDays")}>Age / Overdue Days{txSortIndicator("AgeDays")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("DaysOverdue")}>Days Past Due (loans){txSortIndicator("DaysOverdue")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleTxSort("FineAmount")}>Fine Amount ($){txSortIndicator("FineAmount")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txSorted.map((row, idx) => (
                            <tr key={idx} style={row.NeedsAttention ? { background: "#fff3f3" } : {}}>
                              <td>{row.TransactionType}</td>
                              <td>{row.TransactionType === "Loan" ? row.TransactionID : "—"}</td>
                              <td>{row.UserName}</td>
                              <td>{row.Title ?? "—"}</td>
                              <td>{row.TransactionDate ? new Date(row.TransactionDate).toLocaleDateString() : "—"}</td>
                              <td>{row.StatusLabel ?? "—"}</td>
                              <td>{row.AgeDays ?? "—"}</td>
                              <td>{row.DaysOverdue > 0 ? row.DaysOverdue : "—"}</td>
                              <td>{row.FineAmount != null ? `$${Number(row.FineAmount).toFixed(2)}` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              );
            })()}

            {analyticsTab === "audit" && (() => {
              const auditTables = ["copies", "items", "loans", "users"].filter(tbl =>
                !auditFilters.tableName || auditFilters.tableName === tbl
              );

              const computedAuditSummary = auditHasRun && auditResults.length > 0 ? (() => {
                const total = auditResults.reduce((s, r) => s + r.ActionCount, 0);
                const creates = auditResults.filter(r => r.ActionType === "Created").reduce((s, r) => s + r.ActionCount, 0);
                const updates = auditResults.filter(r => r.ActionType === "Updated").reduce((s, r) => s + r.ActionCount, 0);
                const distinctLibrarians = new Set(auditResults.map(r => r.UserID)).size;
                const tableCountMap = auditResults.reduce((acc, r) => {
                  acc[r.TableName] = (acc[r.TableName] || 0) + r.ActionCount;
                  return acc;
                }, {});
                const topTable = Object.entries(tableCountMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
                const latestTs = auditResults.reduce((max, r) => {
                  const ts = new Date(r.LastActionAt);
                  return ts > max ? ts : max;
                }, new Date(0));
                return {
                  TotalAuditActions: total,
                  TotalCreates: creates,
                  TotalUpdates: updates,
                  DistinctLibrarians: distinctLibrarians,
                  AvgActionsPerLibrarian: distinctLibrarians > 0 ? Math.round(total / distinctLibrarians * 10) / 10 : null,
                  TopTouchedTable: topTable,
                  LatestAuditAction: latestTs.getTime() > 0 ? latestTs.toLocaleDateString() : null,
                };
              })() : (auditSummary ? (Array.isArray(auditSummary) ? auditSummary[0] : auditSummary) : null);

              const as = computedAuditSummary;
              const auditCards = as ? [
                { label: "Total Audit Actions",       value: as.TotalAuditActions },
                { label: "Total Creates",             value: as.TotalCreates },
                { label: "Total Updates",             value: as.TotalUpdates },
                { label: "Active Librarians",         value: as.DistinctLibrarians },
                { label: "Avg Actions / Librarian",   value: as.AvgActionsPerLibrarian },
                { label: "Top Touched Table",         value: as.TopTouchedTable },
                { label: "Latest Audit Action",       value: as.LatestAuditAction ? new Date(as.LatestAuditAction).toLocaleDateString() : "—" },
              ] : [];

              const auditSorted = [...auditResults].sort((a, b) => {
                const dir = auditSort.dir === "asc" ? 1 : -1;
                if (auditSort.key === "LastActionAt") return dir * (new Date(a.LastActionAt) - new Date(b.LastActionAt));
                if (auditSort.key === "FirstActionAt") return dir * (new Date(a.FirstActionAt) - new Date(b.FirstActionAt));
                if (auditSort.key === "UserName") return dir * a.UserName.localeCompare(b.UserName);
                if (auditSort.key === "TableName") return dir * a.TableName.localeCompare(b.TableName);
                if (auditSort.key === "ActionType") return dir * a.ActionType.localeCompare(b.ActionType);
                if (auditSort.key === "ActionCount") return dir * (a.ActionCount - b.ActionCount);
                return 0;
              });

              function toggleAuditSort(key) {
                setAuditSort(prev =>
                  prev.key === key
                    ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
                    : { key, dir: "desc" }
                );
              }
              function auditSortIndicator(key) {
                if (auditSort.key !== key) return " ↕";
                return auditSort.dir === "desc" ? " ↓" : " ↑";
              }

              return (
                <>
                  {auditCards.length > 0 && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                      {auditCards.map(card => (
                        <div key={card.label} style={{
                          border: "1px solid #ccc", borderRadius: "4px",
                          padding: "0.75rem 1rem", minWidth: "130px", flex: "1 1 130px", background: "#f9f9f9"
                        }}>
                          <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>{card.label}</div>
                          <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{card.value ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tables used */}
                  <div style={{ marginBottom: "0.75rem", fontSize: "0.78rem", color: "#555" }}>
                    <span style={{ marginRight: "0.4rem" }}>Tables Used:</span>
                    {auditTables.map(tbl => (
                      <span key={tbl} style={{ display: "inline-block", background: "#eef", border: "1px solid #aac", borderRadius: "3px", padding: "1px 6px", marginRight: "4px", fontFamily: "monospace" }}>{tbl}</span>
                    ))}
                  </div>

                  {/* Filter bar */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ccc" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Start Date</label>
                      <input type="date" value={auditFilters.startDate} onChange={e => setAuditFilters({ ...auditFilters, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>End Date</label>
                      <input type="date" value={auditFilters.endDate} onChange={e => setAuditFilters({ ...auditFilters, endDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Librarian ID</label>
                      <input type="number" placeholder="All" value={auditFilters.librarianId} onChange={e => setAuditFilters({ ...auditFilters, librarianId: e.target.value })} style={{ width: "80px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Table</label>
                      <select value={auditFilters.tableName} onChange={e => setAuditFilters({ ...auditFilters, tableName: e.target.value })}>
                        <option value="">All</option>
                        <option value="users">users</option>
                        <option value="items">items</option>
                        <option value="copies">copies</option>
                        <option value="loans">loans</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "2px" }}>Action Type</label>
                      <select value={auditFilters.actionType} onChange={e => setAuditFilters({ ...auditFilters, actionType: e.target.value })}>
                        <option value="">All</option>
                        <option value="Created">Created</option>
                        <option value="Updated">Updated</option>
                      </select>
                    </div>
                    <button onClick={fetchAuditReport} disabled={auditLoading}>
                      {auditLoading ? "Loading…" : "Run Report"}
                    </button>
                    {(auditFilters.startDate || auditFilters.endDate || auditFilters.librarianId || auditFilters.tableName || auditFilters.actionType) && (
                      <button onClick={() => setAuditFilters({ startDate: "", endDate: "", librarianId: "", tableName: "", actionType: "" })}>
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {!auditHasRun && !auditLoading && (
                    <p style={{ color: "#666" }}>Set filters above and click Run Report to see results.</p>
                  )}
                  {auditHasRun && !auditLoading && auditResults.length === 0 && (
                    <p style={{ color: "#666" }}>No results found for the selected filters.</p>
                  )}
                  {auditSorted.length > 0 && (() => {
                    const barData = Object.values(
                      auditSorted.reduce((acc, r) => {
                        if (!acc[r.UserID]) acc[r.UserID] = { name: r.UserName, Created: 0, Updated: 0 };
                        acc[r.UserID][r.ActionType] = (acc[r.UserID][r.ActionType] || 0) + r.ActionCount;
                        return acc;
                      }, {})
                    ).sort((a, b) => (b.Created + b.Updated) - (a.Created + a.Updated)).slice(0, 10);
                    return (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.4rem" }}>Top {barData.length} librarians by actions</p>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 70 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend iconSize={10} verticalAlign="top" wrapperStyle={{ fontSize: "0.78rem", paddingBottom: "8px" }} />
                            <Bar dataKey="Created" stackId="a" fill="#4a90d9" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Updated" stackId="a" fill="#c8102e" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}

                  {auditSorted.length > 0 && (
                    <>
                      <p style={{ marginBottom: "0.5rem", color: "#555" }}>{auditSorted.length} record{auditSorted.length !== 1 ? "s" : ""} — click a column header to sort</p>
                      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                          <tr>
                            <th>Librarian ID</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("UserName")}>Librarian{auditSortIndicator("UserName")}</th>
                            <th>Email</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("TableName")}>Table{auditSortIndicator("TableName")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("ActionType")}>Action Type{auditSortIndicator("ActionType")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("ActionCount")}>Action Count{auditSortIndicator("ActionCount")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("FirstActionAt")}>First Action{auditSortIndicator("FirstActionAt")}</th>
                            <th style={{ cursor: "pointer" }} onClick={() => toggleAuditSort("LastActionAt")}>Last Action{auditSortIndicator("LastActionAt")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditSorted.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.UserID}</td>
                              <td>{row.UserName}</td>
                              <td>{row.Email}</td>
                              <td style={{ fontFamily: "monospace" }}>{row.TableName}</td>
                              <td>{row.ActionType}</td>
                              <td>{row.ActionCount}</td>
                              <td>{row.FirstActionAt ? new Date(row.FirstActionAt).toLocaleDateString() : "—"}</td>
                              <td>{row.LastActionAt ? new Date(row.LastActionAt).toLocaleDateString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              );
            })()}

            {analyticsTab === "checkouts" && <>

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
                { label: "Checkouts This Week",      value: displaySummary.CheckoutsThisWeek ?? "—" },
                { label: "Checkouts Last Week",      value: displaySummary.CheckoutsLastWeek ?? "—" },
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

            {/* Tables used */}
            {(!analyticsHasRun || analyticsResults.length > 0) && (() => {
              const cat = analyticsHasRun ? (analyticsAppliedFilters?.category ?? "") : "";
              let tables = ["loans", "copies", "items"];
              if (!cat || cat === "1") tables.push("literature");
              if (!cat || cat === "2") tables.push("media");
              if (!cat || cat === "3") tables.push("devices");
              const unique = [...new Set(tables)].sort();
              return (
                <div style={{ marginBottom: "0.75rem", fontSize: "0.78rem", color: "#555" }}>
                  <span style={{ marginRight: "0.4rem" }}>Tables Used:</span>
                  {unique.map(tbl => (
                    <span key={tbl} style={{ display: "inline-block", background: "#eef", border: "1px solid #aac", borderRadius: "3px", padding: "1px 6px", marginRight: "4px", fontFamily: "monospace" }}>{tbl}</span>
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

                {/* Bar chart: top 15 items by checkouts */}
                {(() => {
                  const BAR_COLORS = ["#c8102e","#d63456","#e05a7a","#960c22","#b01030","#6b0018","#f09090"];
                  const barData = [...analyticsResults]
                    .sort((a, b) => b.CheckoutCount - a.CheckoutCount)
                    .slice(0, 10)
                    .map(r => ({
                      name: r.Title.length > 18 ? r.Title.slice(0, 16) + "…" : r.Title,
                      Checkouts: r.CheckoutCount,
                      full: r.Title,
                    }));
                  return (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.4rem" }}>Top {barData.length} items by checkouts</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v, _n, p) => [v, p.payload.full]} />
                          <Bar dataKey="Checkouts" radius={[3, 3, 0, 0]}>
                            {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}

                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "3rem" }}>#</th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("Title")}>
                        Item Title{sortIndicator("Title")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("TypeLabel")}>
                        Item Type{sortIndicator("TypeLabel")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("CheckoutCount")}>
                        Total Checkouts (in range){sortIndicator("CheckoutCount")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("AvgLoanDays")}>
                        Avg Loan Duration (days){sortIndicator("AvgLoanDays")}
                      </th>
                      <th style={{ cursor: "pointer" }} onClick={() => toggleSort("OverdueCount")}>
                        Currently Overdue Copies{sortIndicator("OverdueCount")}
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
            </>}

          </div>
        );
      })()}

      {view === "loans" && (
        <div>
          <h2>Loans</h2>
          <input
                placeholder="Search by LoanID, UserID, Name or Title..."
                value={loanSearch}
                onChange={e => setloanSearch(e.target.value)}
                style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
              />
          {returnError && <p style={{ color: "red", marginBottom: "0.5rem" }}>{returnError}</p>}
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
            <button
              onClick={() => { setLoansTab("returned"); fetchReturnedLoans(); }}
              style={{ fontWeight: loansTab === "returned" ? "bold" : "normal" }}
            >
              Returned
            </button>
          </div>

          {loansTab === "active" && (
            loansLoading ? (
              <p>Loading...</p>
            ) : activeLoans.length === 0 ? (
              <p>No active loans.</p>
            ) : (
              <>
              <h2>Active Loans ({activeLoans.filter(l => `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())).length})</h2>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.filter(l =>
                    `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())
                  ).map(loan => (
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
                      <td>
                        <button onClick={() => handleReturn(loan.LoanID)}>Return</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )
          )}

          {loansTab === "overdue" && (
            loansLoading ? (
              <p>Loading...</p>
            ) : overdueLoans.length === 0 ? (
              <p>No overdue loans.</p>
            ) : (
              <>
              <h2>Overdue Loans ({overdueLoans.filter(l => `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())).length})</h2>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueLoans.filter(l =>
                    `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())
                  ).map(loan => (
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
                      <td>
                        <button onClick={() => handleReturn(loan.LoanID)}>Return</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )
          )}

          {loansTab === "returned" && (
            loansLoading ? (
              <p>Loading...</p>
            ) : returnedLoans.length === 0 ? (
              <p>No returned loans.</p>
            ) : (
              <>
              <h2>Returned Loans ({returnedLoans.filter(l => `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())).length})</h2>
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
                    <th>Return Date</th>
                    <th>Created At</th>
                    <th>Created By</th>
                    <th>Updated At</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedLoans.filter(l =>
                    `${l.LoanID} ${l.UserID} ${l.UserName} ${l.Title}`.toLowerCase().includes(loanSearch.toLowerCase())
                  ).map(loan => (
                    <tr key={loan.LoanID}>
                      <td>{loan.LoanID}</td>
                      <td>{loan.UserID}</td>
                      <td>{loan.UserName}</td>
                      <td>{loan.CopyID}</td>
                      <td>{loan.ItemID}</td>
                      <td>{loan.Title}</td>
                      <td>{loan.DueDate ? new Date(loan.DueDate).toLocaleDateString() : "—"}</td>
                      <td>{loan.ReturnDate ? new Date(loan.ReturnDate).toLocaleString() : "—"}</td>
                      <td>{loan.CreatedAt ? new Date(loan.CreatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.CreatedBy)}</td>
                      <td>{loan.UpdatedAt ? new Date(loan.UpdatedAt).toLocaleString() : "—"}</td>
                      <td>{userNameById(loan.UpdatedBy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )
          )}
        </div>
      )}

      {view === "holds" && (
        <div>
          <input
            placeholder="Search by Hold ID, User ID, Name or Title..."
            value={holdSearch}
            onChange={e => setHoldSearch(e.target.value)}
            style={{ marginBottom: "0.5rem", padding: "0.4rem", width: "100%" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => { setHoldsTab("active"); fetchActiveHolds(); }}
              style={{ fontWeight: holdsTab === "active" ? "bold" : "normal" }}
            >
              Active
            </button>
            <button
              onClick={() => { setHoldsTab("fulfilled"); fetchFulfilledHolds(); }}
              style={{ fontWeight: holdsTab === "fulfilled" ? "bold" : "normal" }}
            >
              Fulfilled
            </button>
          </div>

          {holdsTab === "active" && (
            holdsLoading ? (
              <p>Loading...</p>
            ) : activeHolds.length === 0 ? (
              <p>No active holds.</p>
            ) : (
              <>
                <h2>Active Holds ({activeHolds.filter(h => `${h.HoldID} ${h.UserID} ${h.UserName} ${h.Title}`.toLowerCase().includes(holdSearch.toLowerCase())).length})</h2>
                <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Hold ID</th>
                      <th>User ID</th>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Item ID</th>
                      <th>Title</th>
                      <th>Item Type</th>
                      <th>Days Waiting</th>
                      <th>Placed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHolds.filter(h =>
                      `${h.HoldID} ${h.UserID} ${h.UserName} ${h.Title}`.toLowerCase().includes(holdSearch.toLowerCase())
                    ).map(hold => (
                      <tr key={hold.HoldID} style={hold.DaysWaiting > 7 ? { background: "#fff8f0" } : {}}>
                        <td>{hold.HoldID}</td>
                        <td>{hold.UserID}</td>
                        <td>{hold.UserName}</td>
                        <td>{hold.Email}</td>
                        <td>{hold.ItemID}</td>
                        <td>{hold.Title}</td>
                        <td>{hold.ItemTypeName}</td>
                        <td style={hold.DaysWaiting > 7 ? { color: "#c0392b", fontWeight: "bold" } : {}}>{hold.DaysWaiting}</td>
                        <td>{hold.CreatedAt ? new Date(hold.CreatedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
          )}

          {holdsTab === "fulfilled" && (
            holdsLoading ? (
              <p>Loading...</p>
            ) : fulfilledHolds.length === 0 ? (
              <p>No fulfilled holds.</p>
            ) : (
              <>
                <h2>Fulfilled Holds ({fulfilledHolds.filter(h => `${h.HoldID} ${h.UserID} ${h.UserName} ${h.Title}`.toLowerCase().includes(holdSearch.toLowerCase())).length})</h2>
                <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Hold ID</th>
                      <th>User ID</th>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Item ID</th>
                      <th>Title</th>
                      <th>Item Type</th>
                      <th>Placed On</th>
                      <th>Fulfilled At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fulfilledHolds.filter(h =>
                      `${h.HoldID} ${h.UserID} ${h.UserName} ${h.Title}`.toLowerCase().includes(holdSearch.toLowerCase())
                    ).map(hold => (
                      <tr key={hold.HoldID}>
                        <td>{hold.HoldID}</td>
                        <td>{hold.UserID}</td>
                        <td>{hold.UserName}</td>
                        <td>{hold.Email}</td>
                        <td>{hold.ItemID}</td>
                        <td>{hold.Title}</td>
                        <td>{hold.ItemTypeName}</td>
                        <td>{hold.CreatedAt ? new Date(hold.CreatedAt).toLocaleString() : "—"}</td>
                        <td>{hold.UpdatedAt ? new Date(hold.UpdatedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
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
                `${u.FirstName} ${u.LastName} ${u.Email} ${userTypeLabel(u.UserType)}`.toLowerCase().includes(userSearch.toLowerCase())
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
                  <option value={0}>Inactive</option>
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
