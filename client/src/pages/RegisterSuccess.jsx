import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterSuccess(){
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return(
        <div>Registration successful, redirecting to login page...</div>
    )
}