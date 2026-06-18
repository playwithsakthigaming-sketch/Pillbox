import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Hourglass } from "lucide-react";

const STATUS = {
  pending: {
    label: "Pending Review",
    color: "text-white/80",
    bg: "bg-white/10",
    accent: "border-t-white/30",
    icon: Hourglass,
    blurb: "Your application is in the queue. Command will review it shortly.",
  },
  interview: {
    label: "Interview Scheduled",
    color: "text-[#FFB703]",
    bg: "bg-[#FFB703]/10",
    accent: "border-t-[#FFB703]",
    icon: Clock,
    blurb: "Command wants to talk. Check Discord for the next step.",
  },
  accepted: {
    label: "Accepted",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    accent: "border-t-emerald-500",
    icon: CheckCircle2,
    blurb: "You're in. Welcome to Team Pillbox EMS.",
  },
  rejected: {
    label: "Rejected",
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    accent: "border-t-[#ef4444]",
    icon: XCircle,
    blurb: "Not this time. You can re-apply after 30 days.",
  },
};

export default function StatusPage() {
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    const clean = ref.trim().toLowerCase().replace(/[^a-f0-9-]/g, "");
    if (clean.length < 4) {
      setError("Enter your full 8-character Ref ID.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.get(`/applications/status/${clean}`);
      setResult(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not find that application.");
    } finally {
      setBusy(false);
    }
  };

  const meta = result ? STATUS[result.status] || STATUS.pending : null;
  const Icon = meta?.icon;

  return (
    <div data-testid="status-page" className="text-white pt-28 pb-24 max-w-3xl mx-auto px-6">
      <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
        <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
        APPLICATION STATUS · LOOKUP
      </div>
      <h1 className="h1-ems text-5xl md:text-6xl mt-3">
        CHECK <span className="text-[#2A6DF4]">YOUR REF</span>
      </h1>
      <p className="text-white/70 mt-3">
        Enter the 8-character Reference ID you received after submitting your application.
      </p>

      <form onSubmit={submit} className="mt-8 flex gap-2 items-stretch">
        <input
          data-testid="status-ref-input"
          value={ref}
          onChange={(e) => setRef(e.target.value.toUpperCase())}
          placeholder="A1B2C3D4"
          maxLength={36}
          className="flex-1 bg-[#121212] border border-white/10 px-4 py-3 font-mono-ems tracking-[0.25em] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#2A6DF4]"
        />
        <button
          type="submit"
          data-testid="status-check-btn"
          disabled={busy}
          className="btn-primary-ems px-6 inline-flex items-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          Check
        </button>
      </form>

      {error && (
        <div
          data-testid="status-error"
          className="mt-5 border border-[#ef4444]/40 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444] font-mono-ems"
        >
          {error}
        </div>
      )}

      {result && meta && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="status-card"
          className={`tactical-card mt-8 border-t-2 ${meta.accent}`}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0d0d0d]">
            <span className="font-mono-ems text-[10px] tracking-[0.3em] text-white/80">
              MDT // STATUS_LOOKUP
            </span>
            <span className="font-mono-ems text-[10px] text-white/40">
              REF · {result.ref_id}
            </span>
          </div>
          <div className="p-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${meta.bg} ${meta.color} font-display font-bold text-xs tracking-widest uppercase`}>
              <Icon size={14} /> {meta.label}
            </div>
            <h2 className="font-display font-black text-3xl mt-4 uppercase tracking-tight">
              {result.applicant}
            </h2>
            <div className="font-mono-ems text-xs text-white/60 mt-1">
              IGN: {result.in_game_name}
            </div>
            <p className="text-sm text-white/75 mt-4">{meta.blurb}</p>

            {result.review_message && (
              <div className="mt-5 border border-white/10 bg-[#0d0d0d] p-4">
                <div className="label-ems mb-1">Note from Command</div>
                <div className="text-white/85 text-sm whitespace-pre-wrap">{result.review_message}</div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="label-ems">Submitted</div>
                <div className="font-mono-ems text-white/80 text-xs mt-0.5">
                  {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "—"}
                </div>
              </div>
              <div>
                <div className="label-ems">Last Updated</div>
                <div className="font-mono-ems text-white/80 text-xs mt-0.5">
                  {result.reviewed_at ? new Date(result.reviewed_at).toLocaleString() : "—"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
