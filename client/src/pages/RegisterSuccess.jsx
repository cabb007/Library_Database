import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login");
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-stone-950 text-amber-50 flex items-center justify-center px-4">
            {/* This confirmation card reuses the shared UH utility remap so the
                success state looks like part of the same site, not a plain placeholder. */}
            <div className="w-full max-w-lg bg-stone-900 border border-amber-900/40 rounded-2xl shadow-xl p-10 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-amber-600">Account Ready</p>
                <h1 className="mt-4 text-4xl font-serif text-amber-400">Registration successful</h1>
                <p className="mt-4 text-base text-stone-400 leading-relaxed">
                    Your account has been created. We&apos;ll take you to the sign-in page in a few seconds.
                </p>
                <button
                    onClick={() => navigate("/login")}
                    className="mt-8 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded-lg transition tracking-wide"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
}
