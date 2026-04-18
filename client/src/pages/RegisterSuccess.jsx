import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RegisterSuccess(){
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("/login", { replace: true, state: location.state });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, location.state]);

    return(
        <div>Registration successful, redirecting to login page...</div>
    )
}
