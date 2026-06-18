import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import StaffCard from "../components/StaffCard";
import StaffDetailModal from "../components/StaffDetailModal";
import { Loader2 } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api
      .get("/staff")
      .then((r) => setStaff(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = staff.filter((s) => {
    if (filter === "ALL") return true;
    if (filter === "COMMAND") return s.is_command;
    if (filter === "FIELD") return !s.is_command;
    return true;
  });

  return (
    <div data-testid="staff-page" className="text-white pt-28 pb-16">
      <header className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
          PERSONNEL · ROSTER · LIVE
        </div>
        <div className="mt-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="h1-ems text-5xl md:text-7xl">
            THE <span className="text-[#2A6DF4]">ROSTER</span>
          </h1>
          <p className="text-white/70 max-w-md">
            Click any operator to pull their MDT personnel record — certifications, response
            history, and field specialties.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 inline-flex border border-white/10 bg-[#0d0d0d]">
          {["ALL", "COMMAND", "FIELD"].map((f) => (
            <button
              key={f}
              data-testid={`filter-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 font-display font-bold text-xs tracking-[0.2em] uppercase transition-colors ${
                filter === f
                  ? "bg-[#2A6DF4] text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 mt-10">
        {loading ? (
          <div className="flex items-center gap-2 text-white/60 font-mono-ems text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading personnel...
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            data-testid="staff-grid"
          >
            {filtered.map((s, i) => (
              <StaffCard
                key={s.id}
                staff={s}
                index={i}
                onClick={() => setSelected(s)}
              />
            ))}
          </motion.div>
        )}
      </main>

      <StaffDetailModal
        staff={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
