import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

// Catalog-only decorative art is served through the backend image route so the
// page can reuse stock images without importing them into the client bundle.
function buildDecorativeImageUrl(fileName) {
  return `${API}/library-images/StockPhotos/${encodeURIComponent(fileName)}`;
}

// The catalog uses a shared stock-photo helper so decorative assets can be
// reused across pages without hard-coding a full URL each time.
const CATALOG_BACKGROUND_IMAGE = buildDecorativeImageUrl("replacebar.png");

// Availability copy is normalized here so the table badge text stays consistent
// no matter which catalog tab is currently active.
function formatAvailabilityLabel(count) {
  const numericCount = Number(count) || 0;

  if (numericCount <= 0) {
    return "Hold only";
  }

  if (numericCount === 1) {
    return "1 available";
  }

  return `${numericCount} available`;
}

export default function ItemDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  // Keep the tab values lowercase for existing state checks, but show title-case labels in the UI.
  const catalogTabs = [
    { value: "books", label: "Books" },
    { value: "media", label: "Media" },
    { value: "devices", label: "Devices" },
  ];
  // Match each top-level catalog tab to the ItemType values used by that category in the database.
  const itemTypeFilters = {
    books: [
      { value: 1, label: "Book" },
      { value: 2, label: "Textbook" },
      { value: 3, label: "Magazine" },
      { value: 4, label: "Audiobook" },
    ],
    media: [
      { value: 1, label: "DVD / CD" },
      { value: 2, label: "Blu-ray" },
      { value: 3, label: "Vinyl" },
    ],
    devices: [
      { value: 1, label: "Laptop" },
      { value: 2, label: "Tablet" },
      { value: 3, label: "Equipment" },
    ],
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSubTab, setActiveSubTab] = useState(location.state?.subTab ?? "books");
  // Store one selected ItemType per category so switching tabs does not wipe out the user's last subfilter choice.
  const [activeTypeFilters, setActiveTypeFilters] = useState({
    books: "all",
    media: "all",
    devices: "all",
  });
  const highlightId = location.state?.highlightId ?? null; // highlight item from featured navigation
  const [highlightedId, setHighlightedId] = useState(null);

  const [literature, setLiterature] = useState([]);
  const [media, setMedia] = useState([]);
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Reuse one filter helper so each table only renders items that match the currently selected ItemType button.
  function getFilteredItems(items, categoryKey) {
    const selectedType = activeTypeFilters[categoryKey];

    if (selectedType === "all") return items;

    return items.filter((item) => Number(item.ItemType) === selectedType);
  }

  function applySearchFilter(items) {
    if (!searchQuery.trim()) return items;

    const q = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const haystack = [
        item.ItemID,
        item.Title,
        item.Author,
        item.Publisher,
        item.GenreName,
        item.Producer,
        item.Manufacturer,
        item.Model,
        item.PublicationYear,
        item.DurationMinutes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  // Build the visible rows before rendering so the JSX stays focused on layout instead of filter logic.
  const filteredLiterature = applySearchFilter(
    getFilteredItems(literature, "books")
  );

  const filteredMedia = applySearchFilter(
    getFilteredItems(media, "media")
  );

  const filteredDevices = applySearchFilter(
    getFilteredItems(devices, "devices")
  );

  // The badge renderer keeps the visual availability treatment in one place so
  // books, media, and devices all share the same status wording and colors.
  function renderAvailabilityBadge(count) {
    const isAvailable = Number(count) > 0;

    return (
      <span
        className={`uh-catalog-status ${isAvailable
          ? "uh-catalog-status--available"
          : "uh-catalog-status--hold"
          }`}
      >
        {formatAvailabilityLabel(count)}
      </span>
    );
  }

  // This view config keeps each tab's copy and column presentation together so
  // all three sections can share one prettier table layout. The width classes
  // help dense columns stay compact enough to avoid desktop horizontal scroll.
  const catalogViews = {
    books: {
      title: "Literature Collection",
      description:
        "Browse course texts, classics, magazines, and audiobooks from the Cougar Commons shelves.",
      emptyMessage: "No literature items match the current search and filters.",
      columns: [
        {
          key: "ItemID",
          label: "ISBN",
          className: "uh-catalog-col-code",
          render: (item) => <span className="uh-catalog-mono">{item.ItemID}</span>,
        },
        {
          key: "Title",
          label: "Title",
          className: "uh-catalog-col-title",
          render: (item) => <span className="uh-catalog-primary">{item.Title}</span>,
        },
        {
          key: "GenreName",
          label: "Genre",
          // Book genres tend to be longer than media/device tags, so this uses
          // a wider column class to keep the full label readable.
          className: "uh-catalog-col-genre",
          render: (item) => <span className="uh-catalog-pill">{item.GenreName || "General"}</span>,
        },
        { key: "Publisher", label: "Publisher" },
        { key: "Author", label: "Author" },
        { key: "PublicationYear", label: "Year", className: "uh-catalog-col-year" },
        {
          key: "AvailableCopies",
          label: "Availability",
          className: "uh-catalog-col-status",
          render: (item) => renderAvailabilityBadge(item.AvailableCopies),
        },
      ],
    },
    media: {
      title: "Media Collection",
      description:
        "Explore movies, recordings, and listening-room favorites available for checkout or hold.",
      emptyMessage: "No media items match the current search and filters.",
      columns: [
        {
          key: "Title",
          label: "Name",
          className: "uh-catalog-col-title",
          render: (item) => <span className="uh-catalog-primary">{item.Title}</span>,
        },
        {
          key: "GenreName",
          label: "Genre",
          // Media genres are short enough to fit on one line if the column gets
          // a bit more room, which also pushes the producer column to the right.
          className: "uh-catalog-col-media-genre",
          render: (item) => (
            <span className="uh-catalog-pill uh-catalog-pill--single-line">
              {item.GenreName || "Media"}
            </span>
          ),
        },
        { key: "Producer", label: "Producer" },
        {
          key: "DurationMinutes",
          label: "Duration",
          className: "uh-catalog-col-duration",
          render: (item) => `${item.DurationMinutes ?? 0} min`,
        },
        {
          key: "AvailableCopies",
          label: "Availability",
          className: "uh-catalog-col-status",
          render: (item) => renderAvailabilityBadge(item.AvailableCopies),
        },
      ],
    },
    devices: {
      title: "Device Collection",
      description:
        "Check out laptops, tablets, and equipment set aside for study sessions and class projects.",
      emptyMessage: "No devices match the current search and filters.",
      columns: [
        {
          key: "Title",
          label: "Name",
          className: "uh-catalog-col-title",
          render: (item) => <span className="uh-catalog-primary">{item.Title}</span>,
        },
        { key: "Manufacturer", label: "Manufacturer", className: "uh-catalog-col-maker" },
        {
          key: "Model",
          label: "Model",
          className: "uh-catalog-col-tag",
          render: (item) => <span className="uh-catalog-pill">{item.Model || "Standard"}</span>,
        },
        {
          key: "AvailableCopies",
          label: "Availability",
          className: "uh-catalog-col-status",
          render: (item) => renderAvailabilityBadge(item.AvailableCopies),
        },
      ],
    },
  };

  const activeItems = {
    books: filteredLiterature,
    media: filteredMedia,
    devices: filteredDevices,
  }[activeSubTab];

  // These derived values let the shared shell and shared table renderer switch
  // copy, stats, and column layout whenever the active tab changes.
  const activeView = catalogViews[activeSubTab];
  const activeTabLabel =
    catalogTabs.find((tab) => tab.value === activeSubTab)?.label ?? "Catalog";
  const activeFilterValue = activeTypeFilters[activeSubTab];
  const activeFilterLabel =
    activeFilterValue === "all"
      ? "All item types"
      : itemTypeFilters[activeSubTab].find((filter) => filter.value === activeFilterValue)?.label ??
      "Filtered";

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
          className={`transition-colors duration-700 ${isHighlighted ? "uh-catalog-row-highlight" : ""}`}
        >
          {/* Each column can optionally provide a custom renderer so the shared
              table can show pills, badges, and compact code styling per field. */}
          {columns.map((col) => (
            <td className={`uh-catalog-cell ${col.className ?? ""}`} key={col.key}>
              {col.render ? col.render(item) : item[col.key] ?? "—"}
            </td>
          ))}

          <td className="uh-catalog-cell uh-catalog-col-action">
            <button
              onClick={() =>
                isAvailable ? handleCheckout(item) : handleHold(item)
              }
              className={`uh-catalog-action ${isAvailable
                ? "uh-catalog-action--available"
                : "uh-catalog-action--hold"
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
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-stone-950 text-amber-50">
      {/* This decorative layer is fixed to the viewport so the image stays
          visible while scrolling, and it is centered/larger so it reads more
          clearly behind the catalog without blocking the content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <img
          src={CATALOG_BACKGROUND_IMAGE}
          alt=""
          className="absolute left-1/2 top-1/2 w-[22rem] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.14] md:w-[32rem] md:opacity-[0.18] lg:w-[40rem]"
        />
      </div>

      <nav className="relative z-10 flex justify-between px-10 py-5 border-b border-amber-900/40">
        <h1 className="text-2xl font-serif text-amber-400">Team 7 Library</h1>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 border border-amber-700 text-amber-300 rounded"
        >
          Home
        </button>
      </nav>
      {/* A wider desktop shell gives the denser book table enough horizontal
          room so the column spacing can stay readable without scrolling. */}
      <div className="relative z-10 mx-auto w-full max-w-[90rem] px-6 py-8 md:px-8 lg:px-10">
        <section className="uh-catalog-shell">
          {/* The header gives the active catalog section a stronger sense of
              place so the tables feel like part of a designed dashboard. */}
          <div className="flex flex-col gap-6 px-6 py-7 md:px-8 md:py-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
                Browse Catalog
              </p>
              <h2 className="mt-3 text-4xl font-serif text-amber-400 md:text-5xl">
                {activeView.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-stone-400">
                {activeView.description}
              </p>
            </div>

            <div className="uh-catalog-stats">
              <div className="uh-catalog-stat">
                <span className="uh-catalog-stat-number">{activeItems.length}</span>
                <span className="uh-catalog-stat-label">Matching items</span>
              </div>
              <div className="uh-catalog-stat">
                <span className="uh-catalog-stat-copy">{activeTabLabel}</span>
                <span className="uh-catalog-stat-label">Active section</span>
              </div>
              <div className="uh-catalog-stat">
                <span className="uh-catalog-stat-copy">{activeFilterLabel}</span>
                <span className="uh-catalog-stat-label">Current filter</span>
              </div>
            </div>
          </div>

          <div className="border-y border-amber-900/20 px-6 py-6 md:px-8">
            {/* Grouping the search and filter controls above the table makes the
                page feel more like a curated browser than a plain data dump. */}
            <div className="flex justify-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by title, creator, or genre..."
                className="w-full max-w-2xl rounded-full border border-amber-700 bg-stone-900 px-5 py-3 text-amber-50 shadow-lg shadow-amber-950/10 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {catalogTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveSubTab(tab.value)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold tracking-wide transition ${activeSubTab === tab.value
                    ? "bg-amber-700 text-stone-950 shadow-lg shadow-amber-950/15"
                    : "border border-amber-700 text-amber-300 hover:bg-amber-900/30"
                    }`}
                >
                  {/* Render the title-case label so the tab text matches the requested button styling. */}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Show ItemType subfilters directly below the main category tabs so users can narrow the active catalog view. */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={() =>
                  setActiveTypeFilters((currentFilters) => ({
                    ...currentFilters,
                    [activeSubTab]: "all",
                  }))
                }
                className={`rounded-full px-4 py-2 text-sm transition ${activeTypeFilters[activeSubTab] === "all"
                  ? "bg-amber-700 text-stone-950 shadow-lg shadow-amber-950/15"
                  : "border border-amber-700 text-amber-300 hover:bg-amber-900/30"
                  }`}
              >
                All
              </button>

              {itemTypeFilters[activeSubTab].map((filter) => (
                <button
                  key={`${activeSubTab}-${filter.value}`}
                  onClick={() =>
                    setActiveTypeFilters((currentFilters) => ({
                      ...currentFilters,
                      [activeSubTab]: filter.value,
                    }))
                  }
                  className={`rounded-full px-4 py-2 text-sm transition ${activeTypeFilters[activeSubTab] === filter.value
                    ? "bg-amber-700 text-stone-950 shadow-lg shadow-amber-950/15"
                    : "border border-amber-700 text-amber-300 hover:bg-amber-900/30"
                    }`}
                >
                  {/* Use the database-backed ItemType label so each subfilter button matches its category's real subtype. */}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-6 md:px-8 md:py-8">
            {activeItems.length === 0 ? (
              <div className="uh-catalog-empty">
                <p className="text-lg font-semibold text-amber-300">Nothing matches yet</p>
                <p className="mt-2">{activeView.emptyMessage}</p>
              </div>
            ) : (
              <div className="uh-catalog-table-wrap">
                <table className="uh-catalog-table" aria-label={`${activeTabLabel} catalog table`}>
                  <thead>
                    <tr>
                      {activeView.columns.map((column) => (
                        <th className={column.className ?? ""} key={column.key}>{column.label}</th>
                      ))}
                      <th className="uh-catalog-col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render the already-filtered rows so the table styling can
                        stay generic while the data still responds to each tab. */}
                    {renderTableRows(activeItems, activeView.columns)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="relative z-10 border-t border-amber-900/30 py-4 text-center text-xs text-stone-600">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}
