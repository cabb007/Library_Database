import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {

  const navigate = useNavigate();
  const location = useLocation();
  // Carry the same protected-route return state through registration so a user
  // can still finish the action that originally sent them here.
  const backTo = location.state?.backTo;
  const backState = location.state?.backState;

  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    Password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleBack() {
    // Use the preserved return target first so the back button still works even
    // when this page was opened directly from a checkout redirect.
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

    if (form.Password !== form.confirmPassword) {
      alert("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type" : "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register user");
      }

      setMessage("User registered successfully");
      console.log("Registered:",data);
      // Pass any redirect state forward so the success screen and login page
      // stay connected to the original protected action.
      navigate("/registersuccess", { state: location.state });
    } catch (err) {
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
              Create your account
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-amber-900/30" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label className="text-stone-400 text-sm tracking-wide">
                  First Name
                </label>
                <input
                  type="text"
                  name="FirstName"
                  value={form.FirstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  className="w-full bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <label className="text-stone-400 text-sm tracking-wide">
                  Last Name
                </label>
                <input
                  type="text"
                  name="LastName"
                  value={form.LastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className="w-full bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
                />
              </div>
            </div>

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
                placeholder="you@university.edu"
                className="bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-stone-400 text-sm tracking-wide">
                Password
              </label>
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

            <div className="flex flex-col gap-1">
              <label className="text-stone-400 text-sm tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
            >
              {submitting ? "Creating account.." : "Create Account"}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-stone-500 text-sm">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login", { state: location.state })}
              className="text-amber-600 hover:text-amber-400 transition cursor-pointer"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
