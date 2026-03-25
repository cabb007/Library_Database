import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function LitCatalogue() {
    const navigate = useNavigate();

    const [literature,setLiterature] = useState([]);
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

                console.log(data);

                setLiterature(data);

            } catch (err){
                setError(err.message);
            } finally{
                setLoading(false);
            }
        }

        getLiterature();
    }, []);


    return(
        <div >
            <div className = "items-center justify-center flex">
                <button onClick={() => navigate("/")}>
                   || Home |
                </button>
                <h1>| Book Catalogue |</h1>
                <h1>| Loaded {literature.length} books ||</h1>
            </div>
            
            
            {literature.length === 0 && <p>No books found</p>}
            
            <div className = "items-center justify-center flex">
                <table>
                <thead>
                    <tr>
                        <th>ISBN</th>
                        <th>Author</th>
                        <th>Publisher</th>
                    </tr>
                </thead>
                <tbody>
                    {literature.map((literature) => {
                        return (
                        <tr key={literature.ItemID}>
                            <td>{literature.ItemID}</td>
                            <td>{literature.Author}</td>
                            <td>{literature.Publisher}</td>
                        </tr>
                    )})}
                </tbody>
            </table>
            </div>
            
        </div>
    );
}