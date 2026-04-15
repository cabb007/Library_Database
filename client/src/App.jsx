import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from './pages/RegisterSuccess';
import UserAccount from './pages/UserAccount';
import Catalog from "./pages/Catalog";
import FinePayment from './pages/FinePayment';
import ConfirmationPage from './pages/ConfirmationPage';
import LibrarianDashboard from './pages/LibrarianDashboard';


export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registersuccess" element={<RegisterSuccess />} />
        <Route path="/useraccount" element={<UserAccount />} />
        <Route path="/itemDashBoard" element={<Catalog />} />
        <Route path="/finepayment" element={<FinePayment />} />
        <Route path="/confirmationpage" element ={<ConfirmationPage />} />
        <Route path="/librarian" element={<LibrarianDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
