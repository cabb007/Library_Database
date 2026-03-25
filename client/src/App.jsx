import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from './pages/RegisterSuccess';
import UserAccount from './pages/UserAccount';

export default function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    axios.get('http://localhost:3000/api/users')
        .then(response => setMessage(response.data.message))
        .catch(error => console.error(error));
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registersuccess" element={<RegisterSuccess />} />
        <Route path="/useraccount" element={<UserAccount />} />
      </Routes>
    </BrowserRouter>
  );
}
