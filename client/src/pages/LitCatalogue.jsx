import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function LitCatalogue() {
    const navigate = useNavigate();

    const [books,setBooks] = useState([]);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");

    useEffect(() => {
        async function getLiterature() {
            try {
                const response = await fetch("http://localhost:3000/literature");
                const data = await response.json();

                if(!response.ok){
                    throw new Error(data.error || "Failed to fetch books");
                }

                setBooks(data);

            } catch (err){
                setError(err.message);
            } finally{
                setLoading(false);
            }
        }

        getLiterature();
    }, []);

    return(
        <div>
            <div>
                <button onClick={() => navigate("/")}>
                    Home
                </button>
            </div>
            <h1> ~ Book Catalogue ~ </h1>
            
            {literature.length === 0 && <p>No books found</p>}

            {literature.map(literature => {
                <div key={literature.ItemID}>
                    <p>Author : {literature.Author}</p>
                    <p>Publisher : {literature.Publisher}</p>
                    <p>Publication Year : {literature.PublicationYear}</p>
                    <p>ISBN : {literature.ItemID}</p>
                </div>
            })}
        </div>
    );
}