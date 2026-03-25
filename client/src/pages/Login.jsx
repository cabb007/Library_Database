import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [Email,setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  
  const [form, setForm] = useState({ Email: "", Password: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      const res = await axios.post("http://localhost:3000/login", {
        Email,
        Password
      });

      if (response.data.success) {
        setMessage("Login successful");
        console.log("User: ", response.data.user);
      }

      navigate('/');
    
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Could not connect to server");
      }
    }
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
            onClick={() => navigate("/register")}
            className="text-amber-600 hover:text-amber-400 transition cursor-pointer"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
