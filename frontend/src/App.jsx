import Navbar from "./components/Navbar";
import Home from "./pages/Home";

const tabs = ["Home", "History", "Compare", "Alerts", "Reports", "About"];

export default function App() {
  return (
    <>
      <Navbar tabs={tabs} />
      <main className="pt-20">
        <Home />
      </main>
    </>
  );
}
