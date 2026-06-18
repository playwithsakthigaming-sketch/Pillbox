import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Send, ShieldCheck, Loader2 } from "lucide-react";

const initial = {
  full_name: "",
  in_game_name: "",
  age: 18,
  discord: "",
  steam_hex: "",
  timezone: "EST",
  prior_experience: "",
  why_join: "",
  availability: "",
};

const TIMEZONES = ["PST", "MST", "CST", "EST", "GMT", "CET", "AEST", "IST", "JST"];

export default function ApplyPage() {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: k === "age" ? Number(e.target.value) : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.in_game_name || !form.discord) {
      toast.error("Please fill name, in-game name and Discord.");
      return;
    }
    if (form.age < 13 || form.age > 99) {
      toast.error("Age must be between 13 and 99.");
      return;
    }
    setSubmitting(true);
    try {
      const r = await api.post("/applications", form);
      setDone(r.data);
      toast.success("Application submitted. Stand by for dispatch.");
    } catch (err) {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div data-testid="apply-success" className="text-white pt-32 pb-24 max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="tactical-card p-8 border-t-2 border-t-[#E63946]"
        >
          <div className="flex items-center gap-2 font-mono-ems text-[10px] tracking-[0.3em] text-emerald-400">
            <ShieldCheck size={14} /> APPLICATION RECEIVED
          </div>
          <h1 className="h1-ems text-4xl md:text-5xl mt-4">
            10-4. <span className="text-[#E63946]">Stand by.</span>
          </h1>
          <p className="text-white/70 mt-4">
            Your file has been logged. A command member will reach out via Discord
            within 48 hours for the next step in the recruitment process.
          </p>
          <div className="font-mono-ems text-xs text-white/60 mt-6 border border-white/10 p-4 space-y-1">
            <div><span className="text-white/40">REF ID:</span> {done.id.slice(0, 8).toUpperCase()}</div>
            <div><span className="text-white/40">NAME:</span> {done.full_name}</div>
            <div><span className="text-white/40">DISCORD:</span> {done.discord}</div>
            <div><span className="text-white/40">STATUS:</span> {done.status.toUpperCase()}</div>
          </div>
          <button
            onClick={() => {
              setDone(null);
              setForm(initial);
            }}
            data-testid="apply-another-btn"
            className="btn-ghost-ems px-5 py-3 mt-6 inline-flex"
          >
            Submit another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="apply-page" className="text-white pt-28 pb-24">
      <header className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#E63946]">
          <span className="w-2 h-2 bg-[#E63946] ems-pulse" />
          RECRUITMENT · CHANNEL OPEN
        </div>
        <h1 className="h1-ems text-5xl md:text-7xl mt-3">
          JOIN THE <span className="text-[#E63946]">DEPARTMENT</span>
        </h1>
        <p className="text-white/70 mt-3 max-w-xl">
          Fill out the form below. Be honest — we read every application. Lying about
          experience is the fastest way to get your name on the do-not-call list.
        </p>
      </header>

      <form
        onSubmit={submit}
        data-testid="apply-form"
        className="max-w-4xl mx-auto px-6 lg:px-10 mt-10 space-y-6"
      >
        <section className="tactical-card p-6">
          <div className="label-ems text-[#E63946] mb-4">SECTION 1 · PERSONAL</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input data-testid="apply-fullname" value={form.full_name} onChange={set("full_name")} className={inputCls} placeholder="John A. Doe" required />
            </Field>
            <Field label="In-Game Name *">
              <input data-testid="apply-igname" value={form.in_game_name} onChange={set("in_game_name")} className={inputCls} placeholder="Doc Reyes" required />
            </Field>
            <Field label="Age *">
              <input data-testid="apply-age" type="number" min={13} max={99} value={form.age} onChange={set("age")} className={inputCls} required />
            </Field>
            <Field label="Timezone">
              <select data-testid="apply-tz" value={form.timezone} onChange={set("timezone")} className={inputCls}>
                {TIMEZONES.map((t) => (
                  <option key={t} value={t} className="bg-[#0d0d0d]">{t}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="tactical-card p-6">
          <div className="label-ems text-[#E63946] mb-4">SECTION 2 · CONTACT</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Discord Handle *">
              <input data-testid="apply-discord" value={form.discord} onChange={set("discord")} className={inputCls} placeholder="username#0000" required />
            </Field>
            <Field label="Steam Hex (optional)">
              <input data-testid="apply-steamhex" value={form.steam_hex} onChange={set("steam_hex")} className={inputCls} placeholder="steam:110000..." />
            </Field>
          </div>
        </section>

        <section className="tactical-card p-6">
          <div className="label-ems text-[#E63946] mb-4">SECTION 3 · BACKGROUND</div>
          <div className="space-y-4">
            <Field label="Prior RP / EMS Experience">
              <textarea
                data-testid="apply-experience"
                value={form.prior_experience}
                onChange={set("prior_experience")}
                rows={4}
                className={inputCls}
                placeholder="Servers you've played, roles you've held, real-world EMS knowledge..."
              />
            </Field>
            <Field label="Why do you want to join Team Pillbox?">
              <textarea
                data-testid="apply-why"
                value={form.why_join}
                onChange={set("why_join")}
                rows={4}
                className={inputCls}
                placeholder="Tell us what makes you a good fit..."
              />
            </Field>
            <Field label="Weekly Availability">
              <input data-testid="apply-availability" value={form.availability} onChange={set("availability")} className={inputCls} placeholder="Mon-Fri 7-11pm EST, weekends flexible" />
            </Field>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            data-testid="apply-submit-btn"
            className="btn-primary-ems px-7 py-3.5 inline-flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Transmitting...
              </>
            ) : (
              <>
                Submit Application <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#E63946] focus:border-transparent rounded-sm";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="label-ems block mb-1.5">{label}</span>
    {children}
  </label>
);
