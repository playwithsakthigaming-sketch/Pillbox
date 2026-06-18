import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import StaffPage from "@/pages/StaffPage";
import IdCardPage from "@/pages/IdCardPage";
import ApplyPage from "@/pages/ApplyPage";
import AdminPage from "@/pages/AdminPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App min-h-screen bg-[#0a0a0a] text-white">
      <BrowserRouter>
        <Navbar />
        <main className="min-h-[70vh]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/idcard" element={<IdCardPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#121212",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            fontFamily: "IBM Plex Sans, sans-serif",
          },
        }}
      />
    </div>
  );
}

export default App;
