import { useEffect, useState } from "react";
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

export default function Landing() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ Literature: "—", Media: "—", Devices: "—" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);

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
  }, []);

  const CATEGORIES = [
    { label: "Literature", subTab: "books",   count: counts.Literature, icon: CATEGORY_ICONS.Literature },
    { label: "Media",      subTab: "media",   count: counts.Media,      icon: CATEGORY_ICONS.Media      },
    { label: "Devices",    subTab: "devices", count: counts.Devices,    icon: CATEGORY_ICONS.Devices    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-amber-900/40">
        <h1 className="text-2xl font-serif tracking-widest text-amber-400">
          Cougar Commons
        </h1>
        <div className="flex gap-4">
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
      <div className="flex flex-1 flex-col md:flex-row items-center justify-center gap-16 px-10 py-20 max-w-6xl mx-auto w-full">
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
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => navigate("/login")}
              className="px-7 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide">
              Get Started
            </button>
            <button
              onClick={() => navigate("catalog")} 
              className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide">
              Browse Catalog
            </button>

            <button
            onClick={() => navigate("/litcatalogue")}
            className="px-7 py-3 border border-stone-600 text-stone-300 hover:border-amber-700 hover:text-amber-300 rounded transition tracking-wide"
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

      {/* Footer strip */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs tracking-widest">
        Cougar Commons &mdash; READ MORE, LEARN MORE
      </div>
    </div>
  );
}
