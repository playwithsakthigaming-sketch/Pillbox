import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../lib/api";

const STORAGE_KEY = "pillbox_admin_token";

export function getAdminToken() {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function clearAdminToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function setAdminToken(t) {
  localStorage.setItem(STORAGE_KEY, t);
}

/**
 * Wraps a page that requires admin auth. Renders inline login if no token.
 */
export default function AdminGate({ title = "Admin Area", subtitle = "", children }) {
  const [token, setToken] = useState(getAdminToken());

  if (token) {
    return children;
  }

  return <InlineLogin onAuth={(t) => { setAdminToken(t); setToken(t); }} title={title} subtitle={subtitle} />;
}

function InlineLogin({ onAuth, title, subtitle }) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!val.trim()) return;
    setBusy(true);
    try {
      await api.post("/admin/login", { token: val });
      toast.success("Authorized.");
      onAuth(val);
    } catch {
      toast.error("Invalid admin token.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="admin-gate" className="text-white pt-32 pb-24 max-w-md mx-auto px-6">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="tactical-card p-8 border-t-2 border-t-[#2A6DF4]"
      >
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <Lock size={12} /> RESTRICTED · ADMIN ONLY
        </div>
        <h1 className="h1-ems text-3xl mt-3">{title}</h1>
        {subtitle && <p className="text-white/60 text-sm mt-2">{subtitle}</p>}
        <label className="block mt-6">
          <span className="label-ems">Admin Token</span>
          <input
            data-testid="gate-token-input"
            type="password"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-mono-ems focus:outline-none focus:ring-2 focus:ring-[#2A6DF4]"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          data-testid="gate-submit"
          className="btn-primary-ems w-full mt-5 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Authenticate
        </button>
      </motion.form>
    </div>
  );
}
