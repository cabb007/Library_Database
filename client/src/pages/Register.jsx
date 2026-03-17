import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // TODO: connect to backend
    console.log("Register submitted:", form);
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-stone-900 border border-amber-900/40 rounded-xl shadow-2xl shadow-amber-950/50 p-10 flex flex-col gap-6">
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
                name="firstName"
                value={form.firstName}
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
                name="lastName"
                value={form.lastName}
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
              name="email"
              value={form.email}
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
              name="password"
              value={form.password}
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
            className="mt-2 w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
          >
            Create Account
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-stone-500 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-amber-600 hover:text-amber-400 transition cursor-pointer"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
