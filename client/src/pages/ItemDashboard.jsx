import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ItemDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [activeSubTab, setActiveSubTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [media, setMedia] = useState([]);
  const [devices, setDevices] = useState([]);
  const [checkedOut, setCheckedOut] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/library")
      .then((res) => res.json())
      .then(setBooks)
      .catch(console.error);

    fetch("http://localhost:3000/media")
      .then((res) => res.json())
      .then(setMedia)
      .catch(console.error);

    fetch("http://localhost:3000/devices")
      .then((res) => res.json())
      .then(setDevices)
      .catch(console.error);

    fetch("http://localhost:3000/literature")
      .then((res) => res.json())
      .then(setCheckedOut)
      .catch(console.error);
  }, []);

  const handleCheckout = async (itemId) => {
    try {
      const res = await fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, userId: 1 }),
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col">
      {/* Navbar */}
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

      {/* Tabs */}
      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-6 py-2 rounded ${activeTab === "browse" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
        >
          Browse & Checkout
        </button>
        <button
          onClick={() => setActiveTab("checked")}
          className={`px-6 py-2 rounded ${activeTab === "checked" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
        >
          Checked Out Items
        </button>
        <button
          onClick={() => setActiveTab("holds")}
          className={`px-6 py-2 rounded ${activeTab === "holds" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
        >
          Holds
        </button>
      </div>

      {/* Subtabs */}
      {activeTab === "browse" && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setActiveSubTab("books")}
            className={`px-4 py-1 rounded ${activeSubTab === "books" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
          >
            Book Search
          </button>
          <button
            onClick={() => setActiveSubTab("media")}
            className={`px-4 py-1 rounded ${activeSubTab === "media" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
          >
            Media Search
          </button>
          <button
            onClick={() => setActiveSubTab("devices")}
            className={`px-4 py-1 rounded ${activeSubTab === "devices" ? "bg-amber-700 text-stone-950" : "border border-amber-700 text-amber-300"}`}
          >
            Device Search
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-10 max-w-5xl mx-auto w-full">
        {activeTab === "browse" && activeSubTab === "books" && (
          <div>
            <h2 className="text-3xl font-serif mb-6 text-amber-400">Browse Books</h2>
            <table className="w-full border border-amber-900/30">
              <thead>
                <tr className="bg-stone-900">
                  <th className="p-3">Name</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.ItemID} className="border-t border-amber-900/20">
                    <td className="p-3">{b.Name}</td>
                    <td className="p-3">{b.Author}</td>
                    <td className="p-3">{b.PublicationYear}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCheckout(b.ItemID)}
                        className="bg-amber-700 hover:bg-amber-600 text-stone-950 px-4 py-1 rounded"
                      >
                        Checkout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "browse" && activeSubTab === "media" && (
          <div>
            <h2 className="text-3xl font-serif mb-6 text-amber-400">Browse Media</h2>
            <table className="w-full border border-amber-900/30">
              <thead>
                <tr className="bg-stone-900">
                  <th className="p-3">Name</th>
                  <th className="p-3">Producer</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {media.map((m) => (
                  <tr key={m.ItemID} className="border-t border-amber-900/20">
                    <td className="p-3">{m.Name}</td>
                    <td className="p-3">{m.Producer}</td>
                    <td className="p-3">{m.DurationMinutes}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCheckout(m.ItemID)}
                        className="bg-amber-700 hover:bg-amber-600 text-stone-950 px-4 py-1 rounded"
                      >
                        Checkout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "browse" && activeSubTab === "devices" && (
          <div>
            <h2 className="text-3xl font-serif mb-6 text-amber-400">Browse Devices</h2>
            <table className="w-full border border-amber-900/30">
              <thead>
                <tr className="bg-stone-900">
                  <th className="p-3">Name</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.ItemID} className="border-t border-amber-900/20">
                    <td className="p-3">{d.Name}</td>
                    <td className="p-3">{d.Manufacturer}</td>
                    <td className="p-3">{d.Model}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCheckout(d.ItemID)}
                        className="bg-amber-700 hover:bg-amber-600 text-stone-950 px-4 py-1 rounded"
                      >
                        Checkout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "checked" && (
          <div>
            <h2 className="text-3xl font-serif mb-6 text-amber-400">Checked Out Items</h2>
            <table className="w-full border border-amber-900/30">
              <thead>
                <tr className="bg-stone-900">
                  <th className="p-3">Name</th>
                  <th className="p-3">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {checkedOut.map((b) => (
                  <tr key={b.LoanID} className="border-t border-amber-900/20">
                    <td className="p-3">{b.Name}</td>
                    <td className="p-3">{b.DueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-amber-900/30 py-4 text-center text-stone-600 text-xs">
        Team 7 Library — READ MORE, LEARN MORE
      </div>
    </div>
  );
}