import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { FavoritesProvider } from "./context/FavoritesContext.jsx";
import Home from "./pages/Home.jsx";
import Browse from "./pages/Browse.jsx";
import PetDetail from "./pages/PetDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import BuyerDashboard from "./pages/BuyerDashboard.jsx";
import Messages from "./pages/Messages.jsx";
import Services from "./pages/Services.jsx";
import Profile from "./pages/Profile.jsx";
import Favorites from "./pages/Favorites.jsx";

export default function App() {
  return (
    <FavoritesProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/pets/:id" element={<PetDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard/seller" element={
          <ProtectedRoute role="Seller"><SellerDashboard /></ProtectedRoute>
        } />
        <Route path="/dashboard/buyer" element={
          <ProtectedRoute role="Buyer"><BuyerDashboard /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
      </Routes>
    </FavoritesProvider>
  );
}
