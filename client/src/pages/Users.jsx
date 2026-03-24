import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Users(){
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState("true");
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("https://localhost:3000/api/users")
        .then(res => res.json())
        .then(data => {
            setUsers(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setError("Failed to load user data");
            setLoading(false);
        });
    }, []);

    if (loading) return <h2>loading...</h2>
    if (error) return <h2>{error}</h2>;

    return (
        <div>
            <h1>Users</h1>

            {users.map(user => (
                <div key={user.id} style = {{
                    border: "1px solid black",
                    margin: "10px",
                    padding: "10px",
                    borderRadius: "8px"
                }}>
                    <h3>user.FirstName</h3>
                    <p>user.Email</p>
                </div>    
            ))}
        </div>
    )
}

export default Users;