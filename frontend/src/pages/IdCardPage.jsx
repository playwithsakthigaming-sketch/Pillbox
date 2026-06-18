import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import IdCard from "../components/IdCard";
import AdminGate from "../components/AdminGate";
import { Download, IdCard as IdIcon, RotateCcw } from "lucide-react";

const RANKS = [
  "PROBATIONARY EMT",
  "EMT",
  "PARAMEDIC",
  "SENIOR PARAMEDIC",
  "CAPTAIN",
  "DEPUTY CHIEF",
  "CHIEF OF EMS",
];

const BLOOD = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const initial = {
  full_name: "",
  callsign: "EMS-",
  rank: "PROBATIONARY EMT",
  badge_number: "P-",
  blood_type: "O+",
  photo_url: "",
  issued: new Date().toISOString().slice(0, 10),
  expires: `${new Date().getFullYear() + 2}-12-31`,
  division: "TEAM PILLBOX",
};

export default function IdCardPage() {
  return (
    <AdminGate
      title="ID Card Generator"
      subtitle="Issuing department IDs is restricted to command. Enter the admin token to continue."
    >
      <IdCardForm />
    </AdminGate>
  );
}

function IdCardForm() {
  const [form, setForm] = useState(initial);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photo_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm(initial);
    toast.success("ID card reset");
  };

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#0a0a0a",
      });
      const link = document.createElement("a");
      link.download = `pillbox-ems-${(form.badge_number || "id").replace(/[^a-z0-9-]/gi, "_")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("ID card downloaded");
    } catch (e) {
      toast.error("Could not export ID card. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div data-testid="idcard-page" className="text-white pt-28 pb-24">
      <header className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
          DEPARTMENT ISSUE · ID CARD GENERATOR
        </div>
        <h1 className="h1-ems text-5xl md:text-7xl mt-3">
          ISSUE YOUR <span className="text-[#2A6DF4]">BADGE</span>
        </h1>
        <p className="text-white/70 mt-3 max-w-xl">
          Build your own Team Pillbox EMS identification card. Fill the form, the
          right panel previews your card in real time. Download as PNG.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          <div className="tactical-card p-6">
            <div className="label-ems text-[#2A6DF4] mb-4">SECTION A · IDENTIFICATION</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" testId="id-full-name">
                <input
                  data-testid="id-input-name"
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder="JOHN A. DOE"
                  className={inputCls}
                />
              </Field>
              <Field label="Callsign">
                <input
                  data-testid="id-input-callsign"
                  value={form.callsign}
                  onChange={set("callsign")}
                  placeholder="EMS-15"
                  className={inputCls}
                />
              </Field>
              <Field label="Rank">
                <select
                  data-testid="id-input-rank"
                  value={form.rank}
                  onChange={set("rank")}
                  className={inputCls}
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r} className="bg-[#0d0d0d]">
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Badge Number">
                <input
                  data-testid="id-input-badge"
                  value={form.badge_number}
                  onChange={set("badge_number")}
                  placeholder="P-042"
                  className={inputCls}
                />
              </Field>
              <Field label="Blood Type">
                <select
                  data-testid="id-input-blood"
                  value={form.blood_type}
                  onChange={set("blood_type")}
                  className={inputCls}
                >
                  {BLOOD.map((b) => (
                    <option key={b} value={b} className="bg-[#0d0d0d]">
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Division">
                <input
                  data-testid="id-input-division"
                  value={form.division}
                  onChange={set("division")}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="tactical-card p-6">
            <div className="label-ems text-[#2A6DF4] mb-4">SECTION B · DATES</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Issued">
                <input
                  type="date"
                  data-testid="id-input-issued"
                  value={form.issued}
                  onChange={set("issued")}
                  className={inputCls}
                />
              </Field>
              <Field label="Expires">
                <input
                  type="date"
                  data-testid="id-input-expires"
                  value={form.expires}
                  onChange={set("expires")}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <div className="tactical-card p-6">
            <div className="label-ems text-[#2A6DF4] mb-4">SECTION C · PHOTO</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Photo URL">
                <input
                  data-testid="id-input-photo-url"
                  value={form.photo_url.startsWith("data:") ? "" : form.photo_url}
                  onChange={set("photo_url")}
                  placeholder="https://..."
                  className={inputCls}
                />
              </Field>
              <Field label="Or Upload File">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                  data-testid="id-input-photo-file"
                  className="block w-full text-xs font-mono-ems text-white/70 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-[#2A6DF4] file:text-white file:font-display file:font-bold file:tracking-wider file:uppercase file:cursor-pointer"
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              data-testid="id-download-btn"
              disabled={downloading}
              onClick={download}
              className="btn-primary-ems px-6 py-3 inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download size={16} /> {downloading ? "Exporting..." : "Download PNG"}
            </button>
            <button
              data-testid="id-reset-btn"
              onClick={reset}
              className="btn-ghost-ems px-6 py-3 inline-flex items-center gap-2"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="label-ems text-white/50 mb-3 flex items-center gap-2">
              <IdIcon size={12} /> LIVE PREVIEW
            </div>
            <IdCard ref={cardRef} data={form} />
            <div className="font-mono-ems text-[10px] text-white/40 tracking-widest text-center mt-4">
              UNOFFICIAL · FAN-MADE · FOR RP USE ONLY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-mono-ems focus:outline-none focus:ring-2 focus:ring-[#2A6DF4] focus:border-transparent rounded-sm";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="label-ems block mb-1.5">{label}</span>
    {children}
  </label>
);
