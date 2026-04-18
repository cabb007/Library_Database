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
      { id: 9780061965487, title: "1984",                     credit: "George Orwell",        badge: "BOOK",   image: `${API}/images/literature/1984.jpeg` },
      { id: 9780385490818, title: "The Great Gatsby",          credit: "F. Scott Fitzgerald",  badge: "BOOK",   image: `${API}/images/literature/The Great Gatsby.jpeg` },
      { id: 9780062315007, title: "The Hobbit",               credit: "J.R.R. Tolkien",       badge: "BOOK",   image: `${API}/images/literature/The Hobbit.jpeg` },
      { id: 9780743273565, title: "To Kill a Mockingbird",    credit: "Harper Lee",           badge: "BOOK",   image: `${API}/images/literature/To Kill a Mockingbird.jpeg` },
      { id: 9780316769174, title: "Pride and Prejudice",      credit: "Jane Austen",          badge: "BOOK",   image: `${API}/images/literature/Pride and Prejudice.jpeg` },
      { id: 9780062409867, title: "Crime and Punishment",     credit: "Fyodor Dostoevsky",    badge: "BOOK",   image: `${API}/images/literature/Crime and Punishment.jpeg` },
    ],
  },
  {
    label: "Media",
    subtitle: "Featured films and recordings",
    subTab: "media",
    items: [
      { id: 43396519466,  title: "Inception",                credit: "Christopher Nolan",    badge: "DVD/CD", image: `${API}/images/media/Inception.jpeg` },
      { id: 883929318513, title: "The Godfather",            credit: "Francis Ford Coppola", badge: "DVD/CD", image: `${API}/images/media/The Godfather.jpeg` },
      { id: 31398282068,  title: "The Dark Knight",          credit: "Christopher Nolan",    badge: "DVD/CD", image: `${API}/images/media/The Dark Knight.jpeg` },
      { id: 715515159227, title: "The Shawshank Redemption", credit: "Frank Darabont",       badge: "DVD/CD", image: `${API}/images/media/The Shawshank Redemption.jpeg` },
      { id: 24543153788,  title: "Pulp Fiction",             credit: "Quentin Tarantino",    badge: "DVD/CD", image: `${API}/images/media/Pulp Fiction.jpeg` },
      { id: 786936847543, title: "Goodfellas",               credit: "Martin Scorsese",      badge: "DVD/CD", image: `${API}/images/media/Goodfellas.jpeg` },
    ],
  },
  {
    label: "Devices",
    subtitle: "Technology available for loan",
    subTab: "devices",
    items: [
      { id: 1767950141, title: "MacBook Air M2",             credit: "Apple",     badge: "LAPTOP", image: `${API}/images/devices/Apple,MacBook Air M2.jpeg` },
      { id: 4326338643, title: 'iPad Pro 12.9" M2',         credit: "Apple",     badge: "TABLET", image: `${API}/images/devices/Apple,iPad Pro 12.9-inch M2.jpeg` },
      { id: 2067004398, title: "XPS 15 9530",               credit: "Dell",      badge: "LAPTOP", image: `${API}/images/devices/Dell,XPS 15 9530.jpeg` },
      { id: 6170128796, title: "Surface Pro 9",             credit: "Microsoft", badge: "TABLET", image: `${API}/images/devices/Microsoft,Surface Pro 9.jpeg` },
      { id: 3930751749, title: "ThinkPad X1 Carbon Gen 11", credit: "Lenovo",    badge: "LAPTOP", image: `${API}/images/devices/Lenovo,ThinkPad X1 Carbon Gen 11.jpeg` },
      { id: 2729251472, title: "Galaxy Tab S9 Ultra",        credit: "Samsung",   badge: "TABLET", image: `${API}/images/devices/Samsung,Galaxy Tab S9 Ultra.jpeg` },
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

export default function Landing() {
  const navigate = useNavigate();
  const featuredRef = useRef(null);
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
              onClick={() => featuredRef.current?.scrollIntoView({ behavior: "smooth" })}
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
