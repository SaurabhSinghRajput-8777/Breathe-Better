// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Compare from "./pages/Compare";
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const tabs = ["Home", "Alerts", "History", "Compare", "Reports", "About"];

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] transition-colors">
      
      {/* FIXED NAVBAR */}
      <Navbar tabs={tabs} />

      {/* MAIN CONTENT (pushes footer down) */}
      <main className="flex-1 pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/history" element={<History />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login/>} /> 
          <Route path="/signup" element={<Signup/>} />
        </Routes>
      </main>

      {/* STICKY FOOTER AT BOTTOM */}
      <Footer />
    </div>
  );
}