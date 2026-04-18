import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RegisterSuccess(){
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // After a short pause, send the user into the login flow while preserving
        // any protected-route state that registration inherited.
        const timer = setTimeout(() => {
            navigate("/login", { replace: true, state: location.state });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate, location.state]);

    return(
        <div>Registration successful, redirecting to login page...</div>
    )
}
