import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";

const FEATURED_IMAGE_ASSETS = import.meta.glob("../../images/**/*.{jpeg,jpg,png,webp}", {
  eager: true,
  import: "default",
});

const CHECKOUT_CONFETTI = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: 2 + ((index * 3.8) % 96),
  size: 7 + (index % 4) * 2,
  height: 14 + (index % 5) * 3,
  delay: (index % 6) * 0.09,
  duration: 2.8 + (index % 5) * 0.25,
  drift: -70 + (index % 10) * 16,
  color: ["#f59e0b", "#fbbf24", "#34d399", "#60a5fa", "#f472b6"][index % 5],
}));

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

const FEATURED_SHELVES = [
  {
    key: "literature",
    label: "Literature",
    title: "Featured Literature",
    eyebrow: "Classics worth checking out",
    subTab: "books",
    imageFolder: "literature",
    meta: (item) => `${item.Author} • ${item.PublicationYear}`,
    match: (item, entry) => item.Title === entry.title,
    items: [
      { title: "To Kill a Mockingbird", filename: "To Kill a Mockingbird.jpeg" },
      { title: "1984", filename: "1984.jpeg" },
      { title: "The Great Gatsby", filename: "The Great Gatsby.jpeg" },
      { title: "Pride and Prejudice", filename: "Pride and Prejudice.jpeg" },
      { title: "Brave New World", filename: "Brave New World.jpeg" },
      { title: "The Hobbit", filename: "The Hobbit.jpeg" },
      { title: "Animal Farm", filename: "Animal Farm.jpeg" },
      { title: "Jane Eyre", filename: "Jane Eyre.jpeg" },
    ],
  },
  {
    key: "media",
    label: "Media",
    title: "Featured Media",
    eyebrow: "Films and albums from the stacks",
    subTab: "media",
    imageFolder: "media",
    meta: (item) => `${item.Producer} • ${item.DurationMinutes} min`,
    match: (item, entry) => item.Title === entry.title,
    items: [
      { title: "The Godfather", filename: "The Godfather.jpeg" },
      { title: "The Shawshank Redemption", filename: "The Shawshank Redemption.jpeg" },
      { title: "Pulp Fiction", filename: "Pulp Fiction.jpeg" },
      { title: "Fight Club", filename: "Fight Club.jpeg" },
      { title: "The Matrix", filename: "The Matrix.jpeg" },
      { title: "Inception", filename: "Inception.jpeg" },
      { title: "The Dark Knight", filename: "The Dark Knight.jpeg" },
      { title: "Casablanca", filename: "Casablanca.jpeg" },
    ],
  },
  {
    key: "devices",
    label: "Devices",
    title: "Featured Devices",
    eyebrow: "Tech ready for study sessions",
    subTab: "devices",
    imageFolder: "devices",
    meta: (item) => `${item.Manufacturer} • ${item.Model}`,
    match: (item, entry) =>
      item.Manufacturer === entry.manufacturer && item.Model === entry.model,
    items: [
      {
        manufacturer: "Apple",
        model: "MacBook Pro 14-inch M3",
        filename: "Apple,MacBook Pro 14-inch M3.jpeg",
      },
      {
        manufacturer: "Apple",
        model: "MacBook Air M2",
        filename: "Apple,MacBook Air M2.jpeg",
      },
      {
        manufacturer: "Dell",
        model: "XPS 15 9530",
        filename: "Dell,XPS 15 9530.jpeg",
      },
      {
        manufacturer: "Dell",
        model: "Latitude 5540",
        filename: "Dell,Latitude 5540.jpeg",
      },
      {
        manufacturer: "HP",
        model: "EliteBook 840 G10",
        filename: "HP,EliteBook 840 G10.jpeg",
      },
      {
        manufacturer: "Lenovo",
        model: "ThinkPad X1 Carbon Gen 11",
        filename: "Lenovo,ThinkPad X1 Carbon Gen 11.jpeg",
      },
      {
        manufacturer: "Microsoft",
        model: "Surface Laptop 5",
        filename: "Microsoft,Surface Laptop 5.jpeg",
      },
      {
        manufacturer: "Samsung",
        model: "Galaxy Tab S9 Ultra",
        filename: "Samsung,Galaxy Tab S9 Ultra.jpeg",
      },
    ],
  },
];

function normalizeRows(data) {
  if (Array.isArray(data?.[0])) {
    return data[0];
  }

  return Array.isArray(data) ? data : [];
}

function buildAssetUrl(folder, filename) {
  return FEATURED_IMAGE_ASSETS[`../../images/${folder}/${filename}`] ?? "";
}

function buildFeaturedShelves(catalog) {
  return FEATURED_SHELVES.map((section) => ({
    ...section,
    items: section.items
      .map((entry) => {
        const match = catalog[section.key]?.find((item) => section.match(item, entry));

        if (!match) {
          return null;
        }

        return {
          ...match,
          imageSrc: buildAssetUrl(section.imageFolder, entry.filename),
          metaLabel: section.meta(match),
          availabilityLabel:
            match.AvailableCopies > 0
              ? `${match.AvailableCopies} available`
              : "Currently unavailable",
        };
      })
      .filter(Boolean),
  })).filter((section) => section.items.length > 0);
}

function ShelfArrow({ direction = "right", onClick, label }) {
  const isLeft = direction === "left";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/40 bg-stone-900/80 text-amber-200 transition hover:border-amber-500 hover:bg-stone-800"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={`h-5 w-5 ${isLeft ? "" : "rotate-180"}`}
      >
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function FeaturedShelfRow({ section, onViewAll, onSelectItem }) {
  const stripRef = useRef(null);

  function scrollShelf(direction) {
    const strip = stripRef.current;

    if (!strip) {
      return;
    }

    strip.scrollBy({
      left: direction * Math.max(strip.clientWidth * 0.85, 320),
      behavior: "smooth",
    });
  }

  return (
    <section className="rounded-[2rem] border border-amber-900/30 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] md:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500/80">
            {section.eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-serif text-amber-50 md:text-3xl">
              {section.title}
            </h3>
            <span className="rounded-full border border-amber-800/40 px-3 py-1 text-xs tracking-[0.2em] text-stone-400 uppercase">
              {section.items.length} picks
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ShelfArrow
            direction="left"
            onClick={() => scrollShelf(-1)}
            label={`Scroll ${section.label} left`}
          />
          <ShelfArrow
            direction="right"
            onClick={() => scrollShelf(1)}
            label={`Scroll ${section.label} right`}
          />
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-full border border-amber-700/50 px-5 py-2 text-sm font-semibold tracking-wide text-amber-200 transition hover:border-amber-500 hover:bg-amber-600 hover:text-stone-950"
          >
            View All
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="featured-strip mt-8 flex gap-4 overflow-x-auto pb-3 scroll-smooth"
      >
        {section.items.map((item) => (
          <button
            type="button"
            key={item.ItemID}
            onClick={() => onSelectItem(item, section)}
            className="group w-[10.75rem] shrink-0 text-left"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] border border-amber-900/25 bg-stone-900 shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
              <img
                src={item.imageSrc}
                alt={`${item.Title} cover`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent opacity-80" />
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  item.AvailableCopies > 0
                    ? "bg-emerald-400/90 text-emerald-950"
                    : "bg-stone-200/85 text-stone-900"
                }`}
              >
                {item.availabilityLabel}
              </span>
            </div>

            <div className="px-1 pt-3">
              <p className="min-h-[2.6rem] text-sm font-semibold leading-snug text-amber-50 transition group-hover:text-amber-300">
                {item.Title}
              </p>
              <p className="mt-1 min-h-[2.4rem] text-xs leading-relaxed text-stone-400">
                {item.metaLabel}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ Literature: "—", Media: "—", Devices: "—" });
  const [featuredShelves, setFeaturedShelves] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userType, setUserType] = useState(null);
  const featuredRef = useRef(null);

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

    async function fetchCatalogSummary() {
      try {
        const [litRes, mediaRes, devRes] = await Promise.all([
          fetch(`${API}/api/literature`),
          fetch(`${API}/api/media`),
          fetch(`${API}/api/devices`),
        ]);

        const [lit, media, dev] = await Promise.all([
          litRes.json(),
          mediaRes.json(),
          devRes.json(),
        ]);

        const literature = normalizeRows(lit);
        const mediaItems = normalizeRows(media);
        const deviceItems = normalizeRows(dev);

        setCounts({
          Literature: literature.length,
          Media: mediaItems.length,
          Devices: deviceItems.length,
        });

        setFeaturedShelves(
          buildFeaturedShelves({
            literature,
            media: mediaItems,
            devices: deviceItems,
          })
        );
      } catch (err) {
        console.error(err);
      }
    }

    fetchCatalogSummary();
  }, []);

  useEffect(() => {
    const checkoutState = location.state?.checkoutSuccess;
    const loginState = location.state?.loginSuccess;

    if (!checkoutState && !loginState) {
      return;
    }

    if (checkoutState) {
      setCheckoutSuccess(checkoutState);
    }

    if (loginState) {
      setLoginSuccess(loginState);
    }

    navigate(location.pathname, { replace: true, state: null });

    const timers = [];

    if (checkoutState) {
      timers.push(
        setTimeout(() => {
          setCheckoutSuccess(null);
        }, 4200)
      );
    }

    if (loginState) {
      timers.push(
        setTimeout(() => {
          setLoginSuccess(null);
        }, 3200)
      );
    }

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [location.pathname, location.state, navigate]);

  const CATEGORIES = [
    { label: "Literature", subTab: "books",   count: counts.Literature, icon: CATEGORY_ICONS.Literature },
    { label: "Media",      subTab: "media",   count: counts.Media,      icon: CATEGORY_ICONS.Media      },
    { label: "Devices",    subTab: "devices", count: counts.Devices,    icon: CATEGORY_ICONS.Devices    },
  ];

  function handleFeaturedItemSelect(item, section) {
    if (item.AvailableCopies <= 0) {
      navigate("/catalog", { state: { subTab: section.subTab } });
      return;
    }

    navigate("/confirmationpage", {
      state: {
        itemId: item.ItemID,
        title: item.Title,
        confirmFlag: 1,
        returnTo: {
          pathname: "/",
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {checkoutSuccess && (
        <>
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {CHECKOUT_CONFETTI.map((piece) => (
              <span
                key={piece.id}
                className="checkout-confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.height}px`,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  "--drift": `${piece.drift}px`,
                }}
              />
            ))}
          </div>

          <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
            <div className="checkout-celebration-card w-full max-w-xl rounded-[1.75rem] border border-amber-500/30 bg-stone-900/95 px-8 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
                Successfully checked out
              </p>
              <h3 className="mt-3 text-2xl font-serif text-amber-50 md:text-3xl">
                {checkoutSuccess.title}
              </h3>
              <p className="mt-2 text-sm text-stone-400 md:text-base">
                It is now waiting for you in your account.
              </p>
            </div>
          </div>
        </>
      )}

      {loginSuccess && !checkoutSuccess && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="login-notification-card w-full max-w-lg rounded-[1.4rem] border border-emerald-400/30 bg-stone-900/95 px-7 py-5 text-center shadow-[0_22px_65px_rgba(0,0,0,0.42)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">
              Logged In
            </p>
            <h3 className="mt-2 text-2xl font-serif text-amber-50">
              Welcome back, {loginSuccess.name}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              You are now signed in.
            </p>
          </div>
        </div>
      )}

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
            type="button"
            onClick={() =>
              featuredRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
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
        ref={featuredRef}
        className="w-full border-t border-amber-900/30 bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.18),_transparent_34%),linear-gradient(180deg,_rgba(17,24,39,0.18),_rgba(12,10,9,0.96))] px-6 py-20 md:px-10"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-amber-600">
                Featured Dashboard
              </p>
              <h2 className="text-4xl font-serif leading-tight text-amber-50 md:text-5xl">
                Browse featured picks across literature, media, and devices.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/catalog")}
              className="self-start rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold tracking-wide text-stone-950 transition hover:bg-amber-600"
            >
              Open Full Catalog
            </button>
          </div>

          {featuredShelves.map((section) => (
            <FeaturedShelfRow
              key={section.key}
              section={section}
              onViewAll={() => navigate("/catalog", { state: { subTab: section.subTab } })}
              onSelectItem={handleFeaturedItemSelect}
            />
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs tracking-widest">
        Cougar Commons &mdash; READ MORE, LEARN MORE
      </div>
    </div>
  );
}
