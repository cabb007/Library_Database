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
    return "On hold";
  }

  if (count === 1) {
    return "1 available";
  }

  return `${count} available`;
}

function ShelfCard({ item }) {
  const isAvailable = item.availableCopies > 0;

  return (
    <article className="group w-36 shrink-0 snap-start sm:w-40">
      <div className="overflow-hidden rounded-[1.5rem] border border-amber-900/30 bg-stone-900/85 shadow-lg shadow-amber-950/20 transition hover:-translate-y-1 hover:border-amber-700/50">
        <div className="relative aspect-[3/4] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_52%),linear-gradient(180deg,rgba(68,64,60,0.18),rgba(12,10,9,0.96))]">
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent z-10" />
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
          <div className="absolute inset-x-0 bottom-0 z-20 p-3">
            <span className="inline-flex rounded-full border border-amber-100/15 bg-stone-950/75 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-amber-100/75 backdrop-blur">
              {item.badge}
            </span>
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          <h4 className="h-10 overflow-hidden text-sm font-semibold leading-5 text-amber-50">
            {item.title}
          </h4>
          <p className="h-8 overflow-hidden text-[0.7rem] uppercase tracking-[0.18em] text-stone-500">
            {item.detail}
          </p>
          <div
            className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
              isAvailable
                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border border-amber-500/20 bg-amber-500/10 text-amber-200"
            }`}
          >
            {formatAvailability(item.availableCopies)}
          </div>
        </div>
      </div>
    </article>
  );
}

function ShelfRow({ title, description, items, isLoading, onViewAll }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-2xl font-serif text-amber-50">
          {title} <span className="px-2 text-stone-600">|</span>
          <button
            onClick={onViewAll}
            className="text-xl font-semibold text-amber-400 transition hover:text-amber-300"
          >
            View All
          </button>
        </h3>
        <p className="mt-2 text-sm text-stone-400">{description}</p>
      </div>

      <div className="relative rounded-[1.75rem] border border-amber-900/25 bg-stone-900/40 px-4 py-5 backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 rounded-l-[1.75rem] bg-gradient-to-r from-stone-950/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-[1.75rem] bg-gradient-to-l from-stone-950/80 to-transparent" />

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="w-36 shrink-0 overflow-hidden rounded-[1.5rem] border border-amber-900/20 bg-stone-950/60 sm:w-40"
              >
                <div className="aspect-[3/4] animate-pulse bg-stone-800/80" />
                <div className="space-y-2 p-4">
                  <div className="h-4 animate-pulse rounded bg-stone-800/80" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-stone-900" />
                  <div className="h-5 w-1/2 animate-pulse rounded-full bg-stone-900" />
                </div>
              </div>
            ))}

          {!isLoading && items.map((item) => <ShelfCard key={item.id} item={item} />)}

          {!isLoading && items.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-amber-900/30 bg-stone-950/40 px-6 py-10 text-sm text-stone-400">
              This shelf is empty right now.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ Literature: "—", Media: "—", Devices: "—" });
  const [shelves, setShelves] = useState({
    literature: [],
    media: [],
    devices: [],
  });
  const [shelvesLoading, setShelvesLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const shelvesRef = useRef(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        const data = await res.json();
        setLoggedIn(data.loggedIn === true);
        setUserType(data.user?.UserType ?? null);
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

    async function fetchShelves() {
      try {
        const res = await fetch(`${API}/api/landing/shelves`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch landing shelves");
        }

        setShelves({
          literature: Array.isArray(data.literature) ? data.literature : [],
          media: Array.isArray(data.media) ? data.media : [],
          devices: Array.isArray(data.devices) ? data.devices : [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setShelvesLoading(false);
      }
    }

    fetchShelves();
  }, []);

  const CATEGORIES = [
    { label: "Literature", count: counts.Literature, icon: CATEGORY_ICONS.Literature },
    { label: "Media",      count: counts.Media,      icon: CATEGORY_ICONS.Media      },
    { label: "Devices",    count: counts.Devices,    icon: CATEGORY_ICONS.Devices    },
  ];

  function scrollToShelves() {
    shelvesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex flex-col gap-4 border-b border-amber-900/40 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">
        <h1 className="text-2xl font-serif tracking-widest text-amber-400">
          Team 7 Library
        </h1>
        <div className="flex flex-wrap gap-3 md:justify-end">
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
              className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide">
              Librarian Dashboard
            </button>
          )}
          <button
            onClick={() => navigate("/useraccount")}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold transition rounded text-sm tracking-wide">
            My Account
          </button>
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
            <button
              onClick={() => navigate(loggedIn ? "/catalog" : "/login")}
              className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide">
              {loggedIn ? "Open Catalog" : "Get Started"}
            </button>
            <button
              onClick={() => navigate("/catalog")}
              className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide">
              Browse Catalog
            </button>

            <button
            onClick={scrollToShelves}
            className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide"
            >
              Featured Shelves
            </button>         
          </div>
        </div>

        {/* Category cards */}
        <div className="flex-1 flex flex-col gap-4 max-w-sm w-full">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="flex items-center gap-5 bg-stone-900 border border-amber-900/30 rounded-xl px-6 py-5 shadow-lg shadow-amber-950/30 hover:border-amber-700/50 transition"
            >
              <div className="text-amber-500">{cat.icon}</div>
              <div className="flex-1">
                <p className="text-amber-50 font-semibold text-lg">{cat.label}</p>
                <p className="text-stone-500 text-sm">Available in catalog</p>
              </div>
              <p className="text-amber-400 font-serif text-xl">{cat.count}</p>
            </div>
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
        ref={shelvesRef}
        className="w-full border-t border-amber-900/20 bg-[linear-gradient(180deg,rgba(28,25,23,0),rgba(28,25,23,0.92)),radial-gradient(circle_at_top,rgba(180,83,9,0.16),transparent_38%)] scroll-mt-20"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 md:px-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-500/80">
                Curated Shelves
              </p>
              <h2 className="mt-3 text-4xl font-serif leading-tight text-amber-50 md:text-5xl">
                Browse featured literature, media, and devices in one glance.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-400">
                Modeled after a storefront-style shelf layout, but tuned to fit
                the Cougar Commons visual language.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <div
                  key={`shelf-${cat.label}`}
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

          <ShelfRow
            title="Literature"
            description="Classic reads, textbooks, and audio-first picks with a shelf-style horizontal browse."
            items={shelves.literature}
            isLoading={shelvesLoading}
            onViewAll={() => navigate("/catalog", { state: { subTab: "books" } })}
          />

          <ShelfRow
            title="Media"
            description="Films and audio selections presented in a film-strip-inspired row."
            items={shelves.media}
            isLoading={shelvesLoading}
            onViewAll={() => navigate("/catalog", { state: { subTab: "media" } })}
          />

          <ShelfRow
            title="Devices"
            description="Laptops, tablets, and equipment lined up for quick discovery before full checkout."
            items={shelves.devices}
            isLoading={shelvesLoading}
            onViewAll={() => navigate("/catalog", { state: { subTab: "devices" } })}
          />
        </div>
      </section>

      {/* Footer strip */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs tracking-widest">
        Team 7 Library &mdash; READ MORE, LEARN MORE
      </div>
    </div>
  );
}
