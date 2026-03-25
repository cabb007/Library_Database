import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function FinePayment(){
    const navigate = useNavigate();
    const [user,setUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        payamt: ""
    });

    function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    }

    useEffect(() => {
        async function checkLogin() { //Checks that there is an active session in the browser (logged in), if not, alerts user and immediately redirects to landing page
            try {
                const response = await fetch("http://localhost:3000/me", {
                    credentials:"include"
                });

                const data = await response.json();

                if(response.ok){
                    setUser(data.user);
                } else {
                    setUser(null);
                    alert("You must be logged in to access this page!");
                    navigate("/");
                }

            } catch (err) {
                console.error(err);
            }
        }

        checkLogin();
    }, []);

    async function handleSubmit(){
        try{
            const response = await fetch("http://localhost:3000/finepayment",{
                credentials:"include",
                method: "PUT",
                headers: {
                "Content-Type" : "application/json",
            },
                body: form.payment
            });

            console.log(form.payamt)
            console.log("Balance successfully changed",form.payamt)
        } catch(err){
            console.error(err);
        } finally {
            setSubmitting(false);
        }

        checkLogin();
    }

    return (
        <div className="flex-col text-center gap-5 justify-center">
            <button
            className="bg-amber-700"
            onClick={() => navigate("/")}>
                Home
            </button>
            <h1>Fine Payment Page</h1>
            <div>
                {user ? <h1>Balance : ${user.Balance}</h1>:<p></p>}
            </div>
            <div>
                <form onSubmit={handleSubmit}>
                    <div className="flex-row min-w-2 gap-4">
                        <label className="tracking-wide">
                            Payment Amount
                        </label>
                        <input
                        type="number"
                        name="payamt"
                        min="0"
                        value={form.payamt}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                        className="w-30 bg-stone-800 border border-stone-700 focus:border-amber-700 focus:outline-none rounded px-4 py-2.5 text-amber-50 placeholder-stone-600 transition"
                        >
                        </input>
                    </div>

                    <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-20 py-3 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition tracking-wide"
                    >
                    {submitting ? "Processing..." : "Submit"}
                    </button>
                </form>
            </div>
        </div>
    )
}