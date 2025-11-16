import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Compare from "./pages/Compare";   // <-- keep this
import History from "./pages/History";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import About from "./pages/About";

const tabs = ["Home", "History", "Compare", "Alerts", "Reports", "About"];

export default function App() {
  return (
    <>
      <Navbar tabs={tabs} />

      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </>
  );
}
