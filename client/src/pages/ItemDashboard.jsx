import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ItemDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [activeSubTab, setActiveSubTab] = useState("books");

  const [literature, setLiterature] = useState([]);
  const [media, setMedia] = useState([]);
  const [devices, setDevices] = useState([]);
  const [checkedOut, setCheckedOut] = useState([]);

  // =========================
  // FETCH DATA
  // =========================

  useEffect(() => {
    async function getLiterature() {
      try {
        const res = await fetch(`${API}/api/literature`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setLiterature(Array.isArray(data[0]) ? data[0] : data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    getLiterature();
  }, []);

  useEffect(() => {
    async function getMedia() {
      try {
        const res = await fetch(`${API}/api/media`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setMedia(Array.isArray(data[0]) ? data[0] : data);
      } catch (err) {
        setError(err.message);
      }
    }
    getMedia();
  }, []);

  useEffect(() => {
    async function getDevices() {
      try {
        const res = await fetch(`${API}/api/devices`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const clean = (Array.isArray(data[0]) ? data[0] : data).map((d) => ({
          ...d,
          AvailableCopies: d.AvailableCopies ?? 0,
        }));

        setDevices(clean);
      } catch (err) {
        setError(err.message);
      }
    }
    getDevices();
  }, []);
// =========================
// ACTION HANDLERS (FIXED)
// =========================

async function handleCheckout(itemId) {
  try {
    await fetch("http://localhost:3000/api/changeConfirmflag?value=1", {
      method: "GET",
      credentials: "include",
    });

    await fetch(`http://localhost:3000/api/setSelectedItem?value=${itemId}`, {
      method: "GET",
      credentials: "include",
    });

    // small safety delay (prevents race condition)
    setTimeout(() => {
      navigate("/confirmationpage");
    }, 50);

  } catch (err) {
    console.error("Checkout failed:", err);
  }
}

async function handleHold(itemId) {
  try {
    await fetch("http://localhost:3000/api/changeConfirmflag?value=2", {
      method: "GET",
      credentials: "include",
    });

    await fetch(`http://localhost:3000/api/setSelectedItem?value=${itemId}`, {
      method: "GET",
      credentials: "include",
    });

    setTimeout(() => {
      navigate("/confirmationpage");
    }, 50);

  } catch (err) {
    console.error("Hold failed:", err);
  }
}

  // =========================
  // TABLE RENDER
  // =========================

  const renderTableRows = (items, columns) =>
    items.map((item) => {
      const isAvailable = item.AvailableCopies > 0;

      return (
        <tr key={item.ItemID} className="border-t border-amber-900/20">
          {columns.map((col) => (
            <td className="p-3" key={col.key}>
              {item[col.key] ?? 0}
            </td>
          ))}

          <td className="p-3">
            <button
              onClick={() =>
                isAvailable
                  ? handleCheckout(item.ItemID)
                  : handleHold(item.ItemID)
              }
              className={`px-4 py-1 rounded text-stone-950 ${
                isAvailable
                  ? "bg-amber-700 hover:bg-amber-600"
                  : "bg-stone-600 hover:bg-stone-500"
              }`}
            >
              {isAvailable ? "Checkout" : "Hold"}
            </button>
          </td>
        </tr>
      );
    });

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* NAVBAR */}
      <nav className="flex justify-between px-10 py-5 border-b border-amber-900/40">
        <h1 className="text-2xl font-serif text-amber-400">
          Team 7 Library
        </h1>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 border border-amber-700 text-amber-300 rounded"
        >
          Home
        </button>
      </nav>

      {/* TABS */}
      <div className="flex justify-center gap-6 mt-8">
        {["browse", "checked", "holds"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded ${
              activeTab === tab
                ? "bg-amber-700 text-stone-950"
                : "border border-amber-700 text-amber-300"
            }`}
          >
            {tab === "browse"
              ? "Browse & Checkout"
              : tab === "checked"
              ? "Checked Out"
              : "Holds"}
          </button>
        ))}
      </div>

      {/* SUBTABS */}
      {activeTab === "browse" && (
        <div className="flex justify-center gap-4 mt-4">
          {["books", "media", "devices"].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubTab(sub)}
              className={`px-4 py-1 rounded ${
                activeSubTab === sub
                  ? "bg-amber-700 text-stone-950"
                  : "border border-amber-700 text-amber-300"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      <div className="p-10 max-w-5xl mx-auto w-full">
        {/* BOOKS */}
        {activeSubTab === "books" && (
          <table className="w-full border border-amber-900/30">
            <thead>
              <tr className="bg-stone-900">
                <th className="p-3">ISBN</th>
                <th className="p-3">Title</th>
                <th className="p-3">Publisher</th>
                <th className="p-3">Author</th>
                <th className="p-3">Year</th>
                <th className="p-3">Avail</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(literature, [
                { key: "ItemID" },
                { key: "Title" },
                { key: "Publisher" },
                { key: "Author" },
                { key: "PublicationYear" },
                { key: "AvailableCopies" },
              ])}
            </tbody>
          </table>
        )}

        {/* MEDIA */}
        {activeSubTab === "media" && (
          <table className="w-full border border-amber-900/30">
            <thead>
              <tr className="bg-stone-900">
                <th className="p-3">Name</th>
                <th className="p-3">Producer</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Avail</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(media, [
                { key: "Title" },
                { key: "Producer" },
                { key: "DurationMinutes" },
                { key: "AvailableCopies" },
              ])}
            </tbody>
          </table>
        )}

        {/* DEVICES */}
        {activeSubTab === "devices" && (
          <table className="w-full border border-amber-900/30">
            <thead>
              <tr className="bg-stone-900">
                <th className="p-3">Name</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Model</th>
                <th className="p-3">Avail</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(devices, [
                { key: "Title" },
                { key: "Manufacturer" },
                { key: "Model" },
                { key: "AvailableCopies" },
              ])}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-amber-900/30 py-4 text-center text-xs text-stone-600">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}