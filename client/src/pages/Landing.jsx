import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

// ─── CONFIGURE FEATURED ITEMS  ──────────────────────────────────────
// Replace each `id` with the actual ItemID from database to change navigation.
// Image paths match filenames in server/SQLserver/data/images/
const SHELVES = [
  {
    label: "Literature",
    subtitle: "Curated picks from our book collection",
    subTab: "books",
    items: [
      { id: 9780061965487, title: "1984", credit: "George Orwell", badge: "BOOK", image: `${API}/images/literature/1984.jpeg` },
      { id: 9780385490818, title: "The Great Gatsby", credit: "F. Scott Fitzgerald", badge: "BOOK", image: `${API}/images/literature/The Great Gatsby.jpeg` },
      { id: 9780062315007, title: "The Hobbit", credit: "J.R.R. Tolkien", badge: "BOOK", image: `${API}/images/literature/The Hobbit.jpeg` },
      { id: 9780743273565, title: "To Kill a Mockingbird", credit: "Harper Lee", badge: "BOOK", image: `${API}/images/literature/To Kill a Mockingbird.jpeg` },
      { id: 9780316769174, title: "Pride and Prejudice", credit: "Jane Austen", badge: "BOOK", image: `${API}/images/literature/Pride and Prejudice.jpeg` },
      { id: 9780062409867, title: "Crime and Punishment", credit: "Fyodor Dostoevsky", badge: "BOOK", image: `${API}/images/literature/Crime and Punishment.jpeg` },
    ],
  },
  {
    label: "Media",
    subtitle: "Featured films and recordings",
    subTab: "media",
    items: [
      { id: 43396519466, title: "Inception", credit: "Christopher Nolan", badge: "DVD/CD", image: `${API}/images/media/Inception.jpeg` },
      { id: 883929318513, title: "The Godfather", credit: "Francis Ford Coppola", badge: "DVD/CD", image: `${API}/images/media/The Godfather.jpeg` },
      { id: 31398282068, title: "The Dark Knight", credit: "Christopher Nolan", badge: "DVD/CD", image: `${API}/images/media/The Dark Knight.jpeg` },
      { id: 715515159227, title: "The Shawshank Redemption", credit: "Frank Darabont", badge: "DVD/CD", image: `${API}/images/media/The Shawshank Redemption.jpeg` },
      { id: 24543153788, title: "Pulp Fiction", credit: "Quentin Tarantino", badge: "DVD/CD", image: `${API}/images/media/Pulp Fiction.jpeg` },
      { id: 786936847543, title: "Goodfellas", credit: "Martin Scorsese", badge: "DVD/CD", image: `${API}/images/media/Goodfellas.jpeg` },
    ],
  },
  {
    label: "Devices",
    subtitle: "Technology available for loan",
    subTab: "devices",
    items: [
      { id: 1767950141, title: "MacBook Air M2", credit: "Apple", badge: "LAPTOP", image: `${API}/images/devices/Apple,MacBook Air M2.jpeg` },
      { id: 4326338643, title: 'iPad Pro 12.9" M2', credit: "Apple", badge: "TABLET", image: `${API}/images/devices/Apple,iPad Pro 12.9-inch M2.jpeg` },
      { id: 2067004398, title: "XPS 15 9530", credit: "Dell", badge: "LAPTOP", image: `${API}/images/devices/Dell,XPS 15 9530.jpeg` },
      { id: 6170128796, title: "Surface Pro 9", credit: "Microsoft", badge: "TABLET", image: `${API}/images/devices/Microsoft,Surface Pro 9.jpeg` },
      { id: 3930751749, title: "ThinkPad X1 Carbon Gen 11", credit: "Lenovo", badge: "LAPTOP", image: `${API}/images/devices/Lenovo,ThinkPad X1 Carbon Gen 11.jpeg` },
      { id: 2729251472, title: "Galaxy Tab S9 Ultra", credit: "Samsung", badge: "TABLET", image: `${API}/images/devices/Samsung,Galaxy Tab S9 Ultra.jpeg` },
    ],
  },
];

const CATEGORY_ICONS = {
  Literature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Media: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  ),
  Devices: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function formatAvailability(count) {
  if (count <= 0) {
    return "Currently on hold";
  }

  if (count === 1) {
    return "1 copy available";
  }

  return `${count} copies available`;
}

function FeaturedCard({ entry }) {
  const isAvailable = entry.availableCopies > 0;

  return (
    <article className="uh-featured-card group overflow-hidden rounded-[1.75rem] border border-amber-900/30 bg-stone-900/80 shadow-lg shadow-amber-950/20 transition hover:-translate-y-1 hover:border-amber-700/50">
      {/* These custom UH classes replace the old hard-coded dark amber gradient
          with a lighter red-and-cream treatment that matches the new palette. */}
      <div className="uh-featured-card-media relative aspect-[4/5] overflow-hidden border-b border-amber-900/20">
        <div className="uh-featured-card-overlay absolute inset-0 z-10" />
        <div className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full border border-amber-100/15 bg-stone-950/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-amber-100/80 backdrop-blur">
          {entry.category}
        </div>
        <img
          src={entry.imageUrl}
          alt={entry.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
          <span className="inline-flex items-center rounded-full border border-amber-200/15 bg-stone-950/75 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-amber-100/75 backdrop-blur">
            {entry.badge}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div>
          <h4 className="text-xl font-semibold leading-tight text-amber-50">
            {entry.title}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            {entry.detail}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-amber-900/20 pt-4">
          <p className="text-sm text-stone-500">
            {formatAvailability(entry.availableCopies)}
          </p>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isAvailable
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border border-amber-500/20 bg-amber-500/10 text-amber-200"
              }`}
          >
            {isAvailable ? "Ready Now" : "High Demand"}
          </div>
        </div>
      </div>
    </article>
  );
}

function FeaturedCollection({
  title,
  description,
  entries,
  isLoading,
  onBrowse,
}) {
  return (
    <section className="rounded-[2rem] border border-amber-900/30 bg-stone-900/45 backdrop-blur">
      <div className="flex flex-col gap-4 border-b border-amber-900/20 px-6 py-6 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
            Featured Dashboard
          </p>
          <h3 className="mt-2 text-2xl font-serif text-amber-50">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-400">
            {description}
          </p>
        </div>

        <button
          onClick={onBrowse}
          className="inline-flex items-center justify-center rounded-full border border-amber-700/60 px-5 py-2 text-sm font-medium tracking-wide text-amber-200 transition hover:border-amber-500 hover:text-amber-50"
        >
          Browse Full Catalog
        </button>
      </div>

      <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.75rem] border border-amber-900/20 bg-stone-950/60"
            >
              <div className="aspect-[4/5] animate-pulse bg-stone-800/80" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-800/80" />
                <div className="h-3 w-full animate-pulse rounded bg-stone-900" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-stone-900" />
              </div>
            </div>
          ))}

        {!isLoading &&
          entries.map((entry) => <FeaturedCard key={entry.id} entry={entry} />)}

        {!isLoading && entries.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-amber-900/30 bg-stone-950/40 p-8 text-center text-stone-400 xl:col-span-3">
            Featured picks are unavailable right now, but the catalog is still
            open for browsing.
          </div>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const featuredRef = useRef(null);
  const [counts, setCounts] = useState({ Literature: "—", Media: "—", Devices: "—" });
  const [featured, setFeatured] = useState({ items: [], devices: [] });
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const featuredSectionRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [popupNotif, setPopupNotif] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        const data = await res.json();
        setLoggedIn(data.loggedIn === true);
        setUserType(data.user?.UserType ?? null);
        if (data.loggedIn === true) {
          try {
            const notifRes = await fetch(`${API}/api/notifications`, {
              credentials: "include",
            });

            if (notifRes.ok) {
              const notifData = await notifRes.json();
              setNotifications(Array.isArray(notifData) ? notifData : []);
            }
          } catch (err) {
            console.error("notifications failed", err);
          }
        }
      } catch {
        setLoggedIn(false);
      }
    }
    checkAuth();

    async function fetchCounts() {
      try {
        const [litRes, mediaRes, devRes] = await Promise.all([
          fetch(`${API}/api/literature`),
          fetch(`${API}/api/media`),
          fetch(`${API}/api/devices`),
        ]);
        const [lit, media, dev] = await Promise.all([
          litRes.json(), mediaRes.json(), devRes.json()
        ]);
        setCounts({
          Literature: Array.isArray(lit) ? lit.length : lit[0]?.length ?? "—",
          Media: Array.isArray(media) ? media.length : media[0]?.length ?? "—",
          Devices: Array.isArray(dev) ? dev.length : dev[0]?.length ?? "—",
        });
      } catch (err) {
        console.error(err);
      }
    }
    fetchCounts();

    async function fetchFeatured() {
      try {
        const res = await fetch(`${API}/api/landing/featured`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch featured content");
        }

        setFeatured({
          items: Array.isArray(data.items) ? data.items : [],
          devices: Array.isArray(data.devices) ? data.devices : [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setFeaturedLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  // Each hero card now carries its matching catalog sub-tab so the landing page
  // routes users straight into the correct section after they click a category.
  const CATEGORIES = [
    { label: "Literature", count: counts.Literature, icon: CATEGORY_ICONS.Literature, subTab: "books" },
    { label: "Media", count: counts.Media, icon: CATEGORY_ICONS.Media, subTab: "media" },
    { label: "Devices", count: counts.Devices, icon: CATEGORY_ICONS.Devices, subTab: "devices" },
  ];

  function scrollToFeatured() {
    featuredSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex flex-col gap-4 border-b border-amber-900/40 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">
        <h1 className="text-2xl font-serif tracking-widest text-amber-400">
          Cougar Commons
        </h1>

        <div className="flex items-center gap-4 w-full md:justify-end">

          {/* LEFT BUTTON GROUP */}
          <div className="flex flex-wrap gap-3 items-center">

            {!loggedIn && (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 transition rounded text-sm tracking-wide"
                >
                  Login
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide"
                >
                  Register
                </button>
              </>
            )}

            {userType === 2 && (
              <button
                onClick={() => navigate("/librarian")}
                className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide"
              >
                Librarian Dashboard
              </button>
            )}

            {/* 👇 FIXED: stays next to other buttons */}
            <button
              onClick={() => navigate("/useraccount")}
              className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide"
            >
              My Account
            </button>

          </div>

          {/* RIGHT SIDE: NOTIFICATIONS */}
          {loggedIn && (
            <div className="relative">

              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative px-4 py-2 border border-amber-700 rounded hover:bg-amber-900/30 transition"
              >
                🔔

                {/* 🔴 RED DOT / STAR (only if unread exist) */}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 shadow-lg ring-2 ring-stone-950" />)}
              </button>

              {/* DROPDOWN */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-stone-900 border border-amber-700 rounded-lg shadow-xl z-50">

                  <div className="p-3 border-b border-amber-900/30 text-amber-300">
                    Notifications
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-3 text-stone-400 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((n, i) => {
                        const id = n.NotificationID;

                        return (
                          <div
                            key={id || i}
                            className="p-3 border-b border-amber-900/10 text-sm text-stone-300 flex items-center justify-between gap-3"
                          >
                            {/* TEXT (won’t push button out) */}
                            <div className="flex-1 pr-2 flex flex-col">
                              {/* Header (bold / primary) */}
                              <span className="text-sm font-semibold text-amber-200 leading-snug">
                                {n.header || n.Header}
                              </span>

                              {/* Body (smaller / secondary) */}
                              <span className="text-xs text-stone-400 leading-snug mt-1 line-clamp-2">
                                {n.body || n.Body}
                              </span>
                            </div>

                            {/* BUTTON */}
                            <button
                              onClick={async () => {
                                try {
                                  if (!id) {
                                    console.error("No notification ID found", n);
                                    return;
                                  }

                                  const res = await fetch(`${API}/api/notifications/read`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({ NotificationID: id }), // ⚠️ FIXED KEY
                                  });

                                  const data = await res.json();
                                  console.log("mark read response:", data);

                                  if (!res.ok) {
                                    console.error("SERVER ERROR:", data);
                                    throw new Error(data.error || "Failed to mark as read");
                                  }

                                  // remove current notification
                                  setNotifications(prev => {
                                    const idx = prev.findIndex(item => item.NotificationID === id);

                                    const updated = prev.filter(item => item.NotificationID !== id);

                                    // 👇 show next item (index + 1)
                                    const next = prev[idx + 1] || null;
                                    setPopupNotif(next);

                                    return updated;
                                  });

                                  // auto-close popup after 2s
                                  setTimeout(() => setPopupNotif(null), 2000);

                                } catch (err) {
                                  console.error("mark as read failed", err);
                                }
                              }}
                              className="text-xs px-2 py-1 border border-amber-500 text-amber-200 rounded hover:bg-amber-800/30 transition shrink-0"
                            >
                              Read
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {popupNotif && (
          <div className="fixed bottom-6 right-6 bg-stone-900 border border-amber-700 text-amber-100 px-4 py-3 rounded-lg shadow-xl z-50 animate-fade-in">
            <div className="text-xs uppercase tracking-widest text-amber-400 mb-1">
              Next Notification
            </div>

            <div className="text-sm">
              {popupNotif.header || popupNotif.Header || "No more notifications"}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-16 px-6 py-16 md:flex-row md:px-10 md:py-20">
        {/* Text */}
        <div className="flex-1 flex flex-col gap-6">
          <p className="text-amber-600 text-sm tracking-[0.3em] uppercase">
            Your campus library
          </p>
          <h2 className="text-5xl md:text-6xl font-serif leading-tight">
            Everything you need, <br />
            <span className="text-amber-400">all in one place.</span>
          </h2>
          <p className="text-stone-400 text-lg max-w-md leading-relaxed">
            Browse and borrow books, media, and devices from our catalog.
            Log in with your student or faculty account to get started.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            {!loggedIn && (
              <button
                onClick={() => navigate("/login")}
                className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
              >
                Get Started
              </button>
            )}
            <button
              onClick={() => navigate("/catalog")}
              className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 rounded transition tracking-wide">
              Browse Catalog
            </button>

            <button
              onClick={() => featuredRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 rounded transition tracking-wide"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Category cards */}
        <div className="flex-1 flex flex-col gap-4 max-w-sm w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => navigate("/catalog", { state: { subTab: cat.subTab } })}
              className="flex items-center gap-5 bg-stone-900 border border-amber-900/30 rounded-xl px-6 py-5 shadow-lg shadow-amber-950/30 hover:border-amber-700/50 hover:bg-stone-800 transition text-left w-full"
            >
              <div className="text-amber-500">{cat.icon}</div>
              <div className="flex-1">
                <p className="text-amber-50 font-semibold text-lg">{cat.label}</p>
                <p className="text-stone-500 text-sm">Available in catalog</p>
              </div>
              <p className="text-amber-400 font-serif text-xl">{cat.count}</p>
            </button>
          ))}

          {/* Bookshelf decoration */}
          <div className="flex gap-1.5 justify-center mt-4 px-4">
            {["h-16 bg-amber-800/60 w-3 rounded-sm",
              "h-20 bg-amber-700/50 w-4 rounded-sm",
              "h-14 bg-amber-900/70 w-3 rounded-sm",
              "h-18 bg-amber-800/40 w-3.5 rounded-sm",
              "h-20 bg-amber-700/60 w-3 rounded-sm",
              "h-16 bg-amber-900/50 w-4 rounded-sm",
              "h-14 bg-amber-800/50 w-3 rounded-sm",
              "h-18 bg-amber-700/40 w-3.5 rounded-sm",
              "h-20 bg-amber-800/60 w-3 rounded-sm",
              "h-16 bg-amber-900/60 w-4 rounded-sm",
              "h-14 bg-amber-700/50 w-3 rounded-sm",
              "h-18 bg-amber-800/40 w-3.5 rounded-sm",
            ].map((cls, i) => (
              <div key={i} className={`${cls} self-end`} />
            ))}
            <div className="absolute" />
          </div>
          <div className="h-1 bg-amber-900/40 rounded-full mx-4" />
        </div>
      </div>

      {/* Featured Shelves */}
      <div ref={featuredRef} className="w-full bg-stone-950 px-10 py-14 border-t border-amber-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline gap-3 mb-10">
            <h3 className="text-3xl font-serif text-amber-400 tracking-wide">Featured</h3>
            <span className="text-stone-600 text-sm tracking-widest uppercase">Staff picks</span>
          </div>
          {SHELVES.map((shelf) => (
            <div key={shelf.label} className="mb-14">
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <span className="text-amber-50 font-serif text-2xl tracking-wide">{shelf.label}</span>
                  <p className="text-stone-500 text-sm mt-0.5">{shelf.subtitle}</p>
                </div>
                <button
                  onClick={() => navigate("/catalog", { state: { subTab: shelf.subTab } })}
                  className="text-amber-500 hover:text-amber-300 text-xs tracking-widest uppercase transition shrink-0 ml-4"
                >
                  View All →
                </button>
              </div>
              <div className="h-px bg-amber-900/30 mb-5" />
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {shelf.items.map((item) => (
                  <button
                    key={`${item.id}`} // 
                    onClick={() => navigate("/catalog", { state: { subTab: shelf.subTab, highlightId: item.id } })}
                    className="flex-shrink-0 w-36 bg-stone-900 border border-amber-900/25 rounded-xl overflow-hidden shadow-lg shadow-black/40 hover:border-amber-700/50 hover:bg-stone-800 transition text-left group"
                  >
                    <div className="w-full h-48 bg-stone-800 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">{item.badge}</span>
                      <p className="text-amber-50 text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-stone-500 text-xs truncate">{item.credit}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer strip */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs tracking-widest">
        Cougar Commons &mdash; READ MORE, LEARN MORE
      </div>
    </div>
  );
}
