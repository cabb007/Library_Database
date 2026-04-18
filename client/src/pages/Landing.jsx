import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

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
    <article className="group overflow-hidden rounded-[1.75rem] border border-amber-900/30 bg-stone-900/80 shadow-lg shadow-amber-950/20 transition hover:-translate-y-1 hover:border-amber-700/50">
      <div className="relative aspect-[4/5] overflow-hidden border-b border-amber-900/20 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_52%),linear-gradient(180deg,rgba(68,64,60,0.18),rgba(12,10,9,0.95))]">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent z-10" />
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
  const [counts, setCounts] = useState({ Literature: "—", Media: "—", Devices: "—" });
  const [featured, setFeatured] = useState({ items: [], devices: [] });
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const featuredSectionRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  const CATEGORIES = [
    { label: "Literature", count: counts.Literature, icon: CATEGORY_ICONS.Literature },
    { label: "Media", count: counts.Media, icon: CATEGORY_ICONS.Media },
    { label: "Devices", count: counts.Devices, icon: CATEGORY_ICONS.Devices },
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
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 shadow-lg ring-2 ring-stone-950" />
                )}
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
                        const id = n.notificationId || n.NotificationID || n.id;

                        return (
                          <div
                            key={id || i}
                            className="p-3 border-b border-amber-900/10 text-sm text-stone-300 flex items-center justify-between gap-3"
                          >
                            {/* TEXT (won’t push button out) */}
                            <span className="flex-1 truncate pr-2">
                              {n.message || n.Message}
                            </span>

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
                                    body: JSON.stringify({ notificationId: id }),
                                  });

                                  if (!res.ok) {
                                    throw new Error("Failed to mark as read");
                                  }

                                  // remove from UI immediately
                                  setNotifications(prev =>
                                    prev.filter(item =>
                                      (item.notificationId || item.NotificationID || item.id) !== id
                                    )
                                  );
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
              className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide">
              Browse Catalog
            </button>

            <button
              onClick={scrollToFeatured}
              className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide"
            >
              Featured Dashboard
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

      <section
        ref={featuredSectionRef}
        className="w-full border-t border-amber-900/20 bg-[linear-gradient(180deg,rgba(28,25,23,0),rgba(28,25,23,0.92)),radial-gradient(circle_at_top,rgba(180,83,9,0.18),transparent_38%)] scroll-mt-20"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 md:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-500/80">
                New on Landing
              </p>
              <h2 className="mt-3 text-4xl font-serif leading-tight text-amber-50 md:text-5xl">
                Featured items and devices, right from the front door.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-400">
                This dashboard highlights image-backed favorites from the catalog
                so visitors can jump from discovery to checkout faster.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <div
                  key={`featured-${cat.label}`}
                  className="rounded-2xl border border-amber-900/25 bg-stone-900/60 px-5 py-5"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                    {cat.label}
                  </p>
                  <p className="mt-3 text-3xl font-serif text-amber-300">
                    {cat.count}
                  </p>
                  <p className="mt-1 text-sm text-stone-400">Total records live</p>
                </div>
              ))}
            </div>
          </div>

          <FeaturedCollection
            title="Featured Items"
            description="A highlighted mix of books, audiobooks, and media with cover art from the library image set."
            entries={featured.items}
            isLoading={featuredLoading}
            onBrowse={() => navigate("/catalog")}
          />

          <FeaturedCollection
            title="Featured Devices"
            description="Popular laptops, tablets, and lab-ready equipment that students can spot instantly before heading into the full catalog."
            entries={featured.devices}
            isLoading={featuredLoading}
            onBrowse={() => navigate("/catalog")}
          />
        </div>
      </section>

      {/* Footer strip */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs tracking-widest">
        Cougar Commons &mdash; READ MORE, LEARN MORE
      </div>
    </div>
  );
}
