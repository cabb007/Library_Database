import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ConfirmationPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [confirmFlag, setConfirmFlag] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        /* ================= AUTH CHECK ================= */
        const meRes = await fetch(`${API}/api/me`, {
          credentials: "include",
        });

        const meData = await meRes.json();

        if (!meRes.ok || !meData.user) {
          navigate("/login");
          return;
        }

        setUser(meData.user);

        /* ================= CONFIRM DATA ================= */
        const res1 = await fetch(`${API}/api/confirmdata`, {
          credentials: "include",
        });

        const data1 = await res1.json();
        setConfirmFlag(Number(data1.ConfirmFlag));

        /* ================= TITLE ================= */
        const res2 = await fetch(`${API}/api/title`, {
          credentials: "include",
        });

        const data2 = await res2.json();

        let extractedTitle = "Unknown Item";

        if (Array.isArray(data2)) {
          if (Array.isArray(data2[0])) {
            extractedTitle = data2[0][0]?.Title ?? "Unknown Item";
          } else {
            extractedTitle = data2[0]?.Title ?? "Unknown Item";
          }
        } else if (data2?.Title) {
          extractedTitle = data2.Title;
        }

        setTitle(extractedTitle);

      } catch (err) {
        console.error("Failed to fetch confirmation data:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [navigate]);

  async function handleConfirm() {
    try {
      if (confirmFlag === 1) {
        await fetch(`${API}/api/checkout`, {
          method: "POST",
          credentials: "include",
        });
      } else if (confirmFlag === 2) {
        await fetch(`${API}/api/hold`, {
          method: "POST",
          credentials: "include",
        });
      }

      await fetch(`${API}/api/changeConfirmflag?value=0`, {
        credentials: "include",
      });

      navigate("/itemDashboard");
    } catch (err) {
      console.error("Confirmation failed:", err);
    }
  }

  async function handleCancel() {
    try {
      await fetch(`${API}/api/changeConfirmflag?value=0`, {
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to reset flag:", err);
    }

    navigate("/itemDashboard");
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

      <div className="flex flex-1 items-center justify-center">
        <div className="bg-stone-900 border border-amber-900/40 p-10 rounded-lg text-center">

          <h3 className="text-xl text-amber-300 mb-3">
            {title}
          </h3>

          <h2 className="text-3xl font-serif text-amber-400 mb-8">
            {message}
          </h2>

          <div className="flex gap-6 justify-center">
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 rounded"
            >
              Yes
            </button>

            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-amber-700 text-amber-300 hover:bg-amber-900/30 rounded"
            >
              No
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}