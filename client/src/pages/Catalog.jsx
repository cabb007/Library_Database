import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

export default function ItemDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  // Keep the tab values lowercase for existing state checks, but show title-case labels in the UI.
  const catalogTabs = [
    { value: "books", label: "Books" },
    { value: "media", label: "Media" },
    { value: "devices", label: "Devices" },
  ];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSubTab, setActiveSubTab] = useState(location.state?.subTab ?? "books");
  const highlightId = location.state?.highlightId ?? null; // highlight item from featured navigation
  const [highlightedId, setHighlightedId] = useState(null);

  const [literature, setLiterature] = useState([]);
  const [media, setMedia] = useState([]);
  const [devices, setDevices] = useState([]);

  // =========================
  // FETCH DATA
  // =========================

  useEffect(() => {
    async function getLiterature() {
      try {
        const res = await fetch(`${API}/api/literature`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch literature");

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
        const res = await fetch(`${API}/api/media`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch media");

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
        const res = await fetch(`${API}/api/devices`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch devices");

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

  // scrolls to specific item when highlightID is set, briefly highlights it, 
  // then removes the highlight after 2 seconds
  useEffect(() => { 
    if (!highlightId) return;
    const el = document.getElementById(`row-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(highlightId);
    const t = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(t);
  }, [literature, media, devices, highlightId]);

  // =========================
  // ACTION HANDLERS
  // =========================

  function handleCheckout(item) {
    navigate("/confirmationpage", {
      state: {
        itemId: item.ItemID,
        title: item.Title,
        confirmFlag: 1,
      },
    });
  }

  function handleHold(item) {
    navigate("/confirmationpage", {
      state: {
        itemId: item.ItemID,
        title: item.Title,
        confirmFlag: 2,
      },
    });
  }

  // =========================
  // TABLE RENDER
  // =========================

  const renderTableRows = (items, columns) =>
    items.map((item) => {
      const isAvailable = item.AvailableCopies > 0;
      const isHighlighted = highlightedId === item.ItemID; // checks if current row should be highlighted

      return (
        <tr
          key={item.ItemID}
          id={`row-${item.ItemID}`}
          className={`border-t border-amber-900/20 transition-colors duration-700 ${isHighlighted ? "bg-amber-800/30" : ""}`}
        >
          {columns.map((col) => (
            <td className="p-3" key={col.key}>
              {item[col.key] ?? 0}
            </td>
          ))}

          <td className="p-3">
            <button
              onClick={() =>
                isAvailable ? handleCheckout(item) : handleHold(item)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 text-red-400 flex items-center justify-center">
        {error}
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      <nav className="flex justify-between px-10 py-5 border-b border-amber-900/40">
        <h1 className="text-2xl font-serif text-amber-400">Team 7 Library</h1>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 border border-amber-700 text-amber-300 rounded"
        >
          Home
        </button>
      </nav>

      <div className="flex justify-center gap-4 mt-8">
          {catalogTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveSubTab(tab.value)}
              className={`px-4 py-1 rounded ${
                activeSubTab === tab.value
                  ? "bg-amber-700 text-stone-950"
                  : "border border-amber-700 text-amber-300"
              }`}
            >
              {/* Render the title-case label so the tab text matches the requested button styling. */}
              {tab.label}
            </button>
          ))}
        </div>

      <div className="p-10 max-w-5xl mx-auto w-full">
        {activeSubTab === "books" && (
          <>
            {/* The shared `uh-catalog-table` class keeps the light UH palette
                readable by giving the table headers a subtle branded tint. */}
            <table className="uh-catalog-table w-full border border-amber-900/30">
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
          </>
        )}

        {activeSubTab === "media" && (
          <table className="uh-catalog-table w-full border border-amber-900/30">
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

        {activeSubTab === "devices" && (
          <table className="uh-catalog-table w-full border border-amber-900/30">
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

      <div className="border-t border-amber-900/30 py-4 text-center text-xs text-stone-600">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}
