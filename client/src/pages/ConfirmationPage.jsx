import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data passed from catalog through React Router state
  const { itemId, title = "Unknown Item", confirmFlag } = location.state || {};

  useEffect(() => {
    async function checkAuth() {
      try {
        // ================= AUTH CHECK =================
        const meRes = await fetch(`${API}/api/me`, {
          credentials: "include",
        });

        const meData = await meRes.json();

        // If not logged in, send user to login page
        if (!meRes.ok || !meData.user) {
          navigate("/login");
          return;
        }

        // If this page was opened without item data, return to dashboard
        if (!itemId || !confirmFlag) {
          navigate("/catalog");
          return;
        }
      } catch (err) {
        console.error("Failed to load confirmation page:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [navigate, itemId, confirmFlag]);

  async function handleConfirm() {
    try {
      setSubmitting(true);

      // ================= CHECKOUT =================
      if (confirmFlag === 1) {
        const res = await fetch(`${API}/api/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ itemId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Checkout failed");
        }
      }

      // ================= HOLD =================
      else if (confirmFlag === 2) {
        const res = await fetch(`${API}/api/hold`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ itemId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Hold failed");
        }
      }

      // Return to dashboard after successful action
      navigate("/catalog");
    } catch (err) {
      console.error("Confirmation failed:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate("/catalog");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const message =
    confirmFlag === 1
      ? "Checkout this item?"
      : confirmFlag === 2
      ? "Place a hold on this item?"
      : "Confirm action?";

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-10 py-5 border-b border-amber-900/40">
        <h1 className="text-2xl font-serif tracking-widest text-amber-400">
          Team 7 Library
        </h1>

        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 transition rounded text-sm"
        >
          Home
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-stone-900 border border-amber-900/40 p-10 rounded-lg text-center">
          <h3 className="text-xl text-amber-300 mb-3">{title}</h3>

          <h2 className="text-3xl font-serif text-amber-400 mb-8">
            {message}
          </h2>

          <div className="flex gap-6 justify-center">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 rounded disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Yes"}
            </button>

            <button
              onClick={handleCancel}
              disabled={submitting}
              className="px-6 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 rounded disabled:opacity-50"
            >
              No
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}