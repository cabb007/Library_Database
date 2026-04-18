import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Protected routes pass redirect/back targets through router state so login can
  // finish the original action instead of always dropping the user on a fixed page.
  const redirectTo = location.state?.redirectTo;
  const redirectState = location.state?.redirectState;
  const backTo = location.state?.backTo;
  const backState = location.state?.backState;

  const [Email,setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    Email: "",
    Password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBack() {
    // Prefer the explicit return target from checkout/hold flows, then fall back
    // to browser history, and finally to home if there is no safe history entry.
    if (backTo) {
      navigate(backTo, { replace: true, state: backState });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({
          Email: form.Email,
          Password: form.Password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to login");
      }

      setMessage("Logged in successfully");
      console.log("Logged in as ", data);

      // If login started from a protected page, resume that page with its saved
      // item context. Otherwise, land on home and show the one-time welcome banner.
      if (redirectTo) {
        navigate(redirectTo, { replace: true, state: redirectState });
      } else {
        navigate("/", {
          replace: true,
          state: {
            loginSuccess: {
              name: data.user?.FirstName || data.user?.Email || "User",
            },
          },
        });
      }

    } catch(err){
      alert("Invalid Email or Password");
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-amber-300 transition hover:text-amber-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Card */}
        <div className="w-full bg-stone-900 border border-amber-900/40 rounded-xl shadow-2xl shadow-amber-950/50 p-10 flex flex-col gap-6">
        {/* Logo */}
          <div className="text-center">
            <h1
              onClick={() => navigate("/")}
              className="text-3xl font-serif tracking-widest text-amber-400 cursor-pointer hover:text-amber-300 transition"
            >
              Team 7 Library
            </h1>
            <p className="text-stone-500 text-sm mt-2 tracking-wide">
              Sign in to your account
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-amber-900/30" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-stone-400 text-sm tracking-wide">
                Email
              </label>
              <input
                type="email"
                name="Email"
                value={form.Email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-stone-400 text-sm tracking-wide">
                  Password
                </label>
                <a href="#" className="text-amber-700 hover:text-amber-500 text-xs transition">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                name="Password"
                value={form.Password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
            >
              Sign In
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-stone-500 text-sm">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register", { state: location.state })}
              className="text-amber-600 hover:text-amber-400 transition cursor-pointer"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
