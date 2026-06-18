import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import IdCard from "../components/IdCard";
import AdminGate, { getAdminToken } from "../components/AdminGate";
import { api } from "../lib/api";
import {
  Download,
  IdCard as IdIcon,
  RotateCcw,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

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
      <IdCardFlow />
    </AdminGate>
  );
}

function IdCardFlow() {
  const [step, setStep] = useState("form"); // "form" | "preview"
  const [form, setForm] = useState(initial);

  if (step === "preview") {
    return <PreviewView data={form} onBack={() => setStep("form")} />;
  }
  return (
    <FormView
      form={form}
      setForm={setForm}
      onGenerate={() => {
        if (!form.full_name.trim()) {
          toast.error("Enter a name first.");
          return;
        }
        setStep("preview");
      }}
    />
  );
}

// ===================== FORM VIEW =====================
function FormView({ form, setForm, onGenerate }) {
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
    toast.success("Form reset");
  };

  return (
    <div data-testid="idcard-form-view" className="text-white pt-28 pb-24">
      <header className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
          STEP 1 / 2 · IDENTIFICATION INTAKE
        </div>
        <h1 className="h1-ems text-5xl md:text-7xl mt-3">
          ISSUE A <span className="text-[#2A6DF4]">BADGE</span>
        </h1>
        <p className="text-white/70 mt-3 max-w-xl">
          Fill the form below. When you hit <span className="text-white font-semibold">Generate</span>,
          you'll be sent to the ID card preview where you can download the PNG.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 mt-10 space-y-5">
        <Section title="SECTION A · IDENTIFICATION">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input data-testid="id-input-name" value={form.full_name} onChange={set("full_name")} placeholder="JOHN A. DOE" className={inputCls} />
            </Field>
            <Field label="Callsign">
              <input data-testid="id-input-callsign" value={form.callsign} onChange={set("callsign")} placeholder="EMS-15" className={inputCls} />
            </Field>
            <Field label="Rank">
              <select data-testid="id-input-rank" value={form.rank} onChange={set("rank")} className={inputCls}>
                {RANKS.map((r) => <option key={r} value={r} className="bg-[#0d0d0d]">{r}</option>)}
              </select>
            </Field>
            <Field label="Badge Number">
              <input data-testid="id-input-badge" value={form.badge_number} onChange={set("badge_number")} placeholder="P-042" className={inputCls} />
            </Field>
            <Field label="Blood Type">
              <select data-testid="id-input-blood" value={form.blood_type} onChange={set("blood_type")} className={inputCls}>
                {BLOOD.map((b) => <option key={b} value={b} className="bg-[#0d0d0d]">{b}</option>)}
              </select>
            </Field>
            <Field label="Division">
              <input data-testid="id-input-division" value={form.division} onChange={set("division")} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="SECTION B · DATES">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Issued">
              <input type="date" data-testid="id-input-issued" value={form.issued} onChange={set("issued")} className={inputCls} />
            </Field>
            <Field label="Expires">
              <input type="date" data-testid="id-input-expires" value={form.expires} onChange={set("expires")} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="SECTION C · PHOTO">
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
        </Section>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            data-testid="id-generate-btn"
            onClick={onGenerate}
            className="btn-primary-ems px-6 py-3 inline-flex items-center gap-2"
          >
            <Sparkles size={16} /> Generate ID Card
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
    </div>
  );
}

// ===================== PREVIEW VIEW =====================
function PreviewView({ data, onBack }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#0a0a0a",
      });
      // Trigger the download
      const link = document.createElement("a");
      link.download = `pillbox-ems-${(data.badge_number || "id").replace(/[^a-z0-9-]/gi, "_")}.png`;
      link.href = dataUrl;
      link.click();

      // Log to Discord (fire-and-forget)
      try {
        await api.post(
          "/admin/idcard/log",
          {
            full_name: data.full_name,
            callsign: data.callsign,
            rank: data.rank,
            badge_number: data.badge_number,
            blood_type: data.blood_type,
            issued: data.issued,
            expires: data.expires,
            division: data.division,
          },
          { headers: { "X-Admin-Token": getAdminToken() } }
        );
      } catch (_) {
        // non-fatal
      }
      toast.success("ID card downloaded · logged to Discord");
    } catch (e) {
      toast.error("Export failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="idcard-preview-view" className="text-white pt-28 pb-24">
      <header className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
          STEP 2 / 2 · PREVIEW · DOWNLOAD
        </div>
        <h1 className="h1-ems text-5xl md:text-7xl mt-3">
          YOUR <span className="text-[#2A6DF4]">ID CARD</span>
        </h1>
        <p className="text-white/70 mt-3 max-w-xl">
          Review the card on the right. Click <span className="text-white font-semibold">Download PNG</span> to
          save it — a record is logged to the department Discord automatically.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-4 order-2 md:order-1">
          <div className="label-ems flex items-center gap-2">
            <IdIcon size={12} /> ISSUED RECORD
          </div>
          <div className="tactical-card p-5 font-mono-ems text-sm text-white/85 space-y-2">
            <Row k="NAME" v={data.full_name || "—"} />
            <Row k="CALLSIGN" v={data.callsign || "—"} />
            <Row k="RANK" v={data.rank || "—"} />
            <Row k="BADGE" v={data.badge_number || "—"} />
            <Row k="BLOOD" v={data.blood_type || "—"} />
            <Row k="ISSUED" v={data.issued || "—"} />
            <Row k="EXPIRES" v={data.expires || "—"} />
            <Row k="DIVISION" v={data.division || "—"} />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              data-testid="id-download-btn"
              disabled={busy}
              onClick={download}
              className="btn-primary-ems px-6 py-3 inline-flex items-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {busy ? "Exporting..." : "Download PNG"}
            </button>
            <button
              data-testid="id-back-btn"
              onClick={onBack}
              className="btn-ghost-ems px-6 py-3 inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Edit
            </button>
          </div>

          <p className="font-mono-ems text-[10px] text-white/40 tracking-widest leading-relaxed pt-2">
            UNOFFICIAL · FAN-MADE · FOR RP USE ONLY. EVERY DOWNLOAD IS LOGGED TO THE DEPARTMENT
            DISCORD CHANNEL.
          </p>
        </div>

        <div className="order-1 md:order-2 flex justify-center">
          <IdCard ref={cardRef} data={data} />
        </div>
      </div>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex items-center justify-between gap-3 border-b border-white/5 last:border-0 pb-1.5">
    <span className="text-white/40 tracking-widest text-[10px] uppercase">{k}</span>
    <span className="text-white truncate text-right">{v}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="tactical-card p-6">
    <div className="label-ems text-[#2A6DF4] mb-4">{title}</div>
    {children}
  </div>
);

const inputCls =
  "w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-mono-ems focus:outline-none focus:ring-2 focus:ring-[#2A6DF4] focus:border-transparent rounded-sm";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="label-ems block mb-1.5">{label}</span>
    {children}
  </label>
);
