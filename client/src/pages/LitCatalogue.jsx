import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LitCatalogue() {
    const navigate = useNavigate();

    

    return(
        <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center justify-center px-4">
            <div>
                <button 
                className="text-3xl font-serif tracking-widest text-amber-400 cursor-pointer hover:text-amber-300 transition"
                onClick={() => navigate("/")}>
                    Home
                </button>
            </div>
            <h1 className="text-3xl font-serif tracking-widest text-amber-400 cursor-pointer">
                Book Catalogue
            </h1>
        </div>
    );
}