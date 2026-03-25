import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from './pages/RegisterSuccess';
import UserAccount from './pages/UserAccount';
import ItemDashboard from "./pages/ItemDashboard";
import LitCatalogue from './pages/LitCatalogue';
import FinePayment from './pages/FinePayment';


export default function App() {
  const [message, setMessage] = useState('')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registersuccess" element={<RegisterSuccess />} />
        <Route path="/useraccount" element={<UserAccount />} />
        <Route path="/itemDashBoard" element={<ItemDashboard />} />
        <Route path="/litcatalogue" element={<LitCatalogue />} />
        <Route path="/finepayment" element={<FinePayment />} />
      </Routes>
    </BrowserRouter>
  );
}
