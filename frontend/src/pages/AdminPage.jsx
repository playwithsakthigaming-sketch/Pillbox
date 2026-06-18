import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "../lib/api";
import {
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Users,
  Inbox,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Undo2,
  MapPin,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

const STORAGE_KEY = "pillbox_admin_token";

const emptyStaff = {
  name: "",
  callsign: "EMS-",
  rank: "EMT",
  role: "Field Medic",
  badge_number: "P-",
  years_served: 0,
  photo_url: "",
  bio: "",
  certifications: "",
  specialties: "",
  experience_cities: [],
  is_command: false,
  contact_discord: "",
};

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [tab, setTab] = useState("staff");

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
  };

  if (!token) {
    return <LoginPanel onLogin={(t) => { localStorage.setItem(STORAGE_KEY, t); setToken(t); }} />;
  }

  return (
    <div data-testid="admin-page" className="text-white pt-28 pb-24">
      <header className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
              <ShieldCheck size={12} />
              ADMIN · CONTROL CENTER
            </div>
            <h1 className="h1-ems text-4xl md:text-6xl mt-2">
              DISPATCH <span className="text-[#2A6DF4]">CONSOLE</span>
            </h1>
          </div>
          <button
            data-testid="admin-logout-btn"
            onClick={logout}
            className="btn-ghost-ems px-4 py-2 text-xs inline-flex items-center gap-2"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="mt-8 inline-flex border border-white/10 bg-[#0d0d0d] flex-wrap">
          <TabBtn active={tab === "staff"} onClick={() => setTab("staff")} testId="tab-staff">
            <Users size={14} /> Staff
          </TabBtn>
          <TabBtn active={tab === "applications"} onClick={() => setTab("applications")} testId="tab-apps">
            <Inbox size={14} /> Applications
          </TabBtn>
          <TabBtn active={tab === "gallery"} onClick={() => setTab("gallery")} testId="tab-gallery">
            <ImageIcon size={14} /> Gallery
          </TabBtn>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
        {tab === "staff" && <StaffManager token={token} onUnauth={logout} />}
        {tab === "applications" && <ApplicationsManager token={token} onUnauth={logout} />}
        {tab === "gallery" && <GalleryManager token={token} onUnauth={logout} />}
      </main>
    </div>
  );
}

const TabBtn = ({ active, onClick, testId, children }) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className={`px-5 py-2.5 font-display font-bold text-xs tracking-[0.2em] uppercase transition-colors inline-flex items-center gap-2 ${
      active ? "bg-[#2A6DF4] text-white" : "text-white/70 hover:text-white"
    }`}
  >
    {children}
  </button>
);

// ===================== LOGIN =====================
function LoginPanel({ onLogin }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    try {
      await api.post("/admin/login", { token });
      toast.success("Authorized. Welcome.");
      onLogin(token);
    } catch {
      toast.error("Invalid admin token.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="admin-login" className="text-white pt-32 pb-24 max-w-md mx-auto px-6">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="tactical-card p-8 border-t-2 border-t-[#2A6DF4]"
      >
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <Lock size={12} /> SECURE ACCESS
        </div>
        <h1 className="h1-ems text-3xl mt-3">Admin Login</h1>
        <p className="text-white/60 text-sm mt-2">
          Enter your admin token (set as <span className="font-mono-ems text-white/80">ADMIN_TOKEN</span> in
          backend <span className="font-mono-ems text-white/80">.env</span>).
        </p>
        <label className="block mt-6">
          <span className="label-ems">Token</span>
          <input
            data-testid="admin-token-input"
            type="password"
            autoFocus
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="••••••••"
            className="mt-2 w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-mono-ems focus:outline-none focus:ring-2 focus:ring-[#2A6DF4]"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          data-testid="admin-login-btn"
          className="btn-primary-ems w-full mt-5 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Authenticate
        </button>
      </motion.form>
    </div>
  );
}

// ===================== STAFF MANAGER =====================
function StaffManager({ token, onUnauth }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // staff object or null
  const [creating, setCreating] = useState(false);

  const auth = { headers: { "X-Admin-Token": token } };

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/staff");
      setStaff(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.name} (${s.callsign})?`)) return;
    try {
      await api.delete(`/admin/staff/${s.id}`, auth);
      toast.success(`Removed ${s.name}`);
      load();
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error("Delete failed");
    }
  };

  const save = async (data, id) => {
    const payload = normalize(data);
    try {
      if (id) {
        await api.patch(`/admin/staff/${id}`, payload, auth);
        toast.success("Staff updated");
      } else {
        await api.post("/admin/staff", payload, auth);
        toast.success("Staff added");
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error(e?.response?.data?.detail || "Save failed");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="label-ems">Personnel · {staff.length} active</div>
        <button
          data-testid="staff-add-btn"
          onClick={() => setCreating(true)}
          className="btn-primary-ems px-4 py-2 text-xs inline-flex items-center gap-2"
        >
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/60 font-mono-ems text-sm">
          <Loader2 className="animate-spin" size={16} /> Loading...
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-sm" data-testid="staff-table">
            <thead className="bg-[#0d0d0d] text-left">
              <tr className="font-mono-ems text-[10px] tracking-widest text-white/50 uppercase">
                <th className="px-4 py-3">Callsign</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Yrs</th>
                <th className="px-4 py-3">Cmd</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono-ems text-[#2A6DF4]">{s.callsign}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-white/70">{s.rank}</td>
                  <td className="px-4 py-3 font-mono-ems text-white/70">{s.badge_number}</td>
                  <td className="px-4 py-3 font-mono-ems text-white/70">{s.years_served}</td>
                  <td className="px-4 py-3">
                    {s.is_command ? (
                      <span className="text-[#FFB703] font-mono-ems text-[10px]">COMMAND</span>
                    ) : (
                      <span className="text-white/40 font-mono-ems text-[10px]">FIELD</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      data-testid={`edit-${s.callsign}`}
                      onClick={() => setEditing(s)}
                      className="p-2 text-white/70 hover:text-white"
                      aria-label="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      data-testid={`delete-${s.callsign}`}
                      onClick={() => remove(s)}
                      className="p-2 text-white/70 hover:text-[#2A6DF4]"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <StaffEditor
          initial={editing || emptyStaff}
          isNew={!editing}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={(d) => save(d, editing?.id)}
        />
      )}
    </section>
  );
}

const normalize = (data) => ({
  name: data.name,
  callsign: data.callsign,
  rank: data.rank,
  role: data.role,
  badge_number: data.badge_number,
  years_served: Number(data.years_served || 0),
  photo_url: data.photo_url,
  bio: data.bio,
  certifications: Array.isArray(data.certifications)
    ? data.certifications
    : (data.certifications || "").split(",").map((s) => s.trim()).filter(Boolean),
  specialties: Array.isArray(data.specialties)
    ? data.specialties
    : (data.specialties || "").split(",").map((s) => s.trim()).filter(Boolean),
  experience_cities: (data.experience_cities || [])
    .map((c) => ({
      city: (c.city || "").trim(),
      grade: (c.grade || "").trim(),
      months: Number(c.months || 0),
    }))
    .filter((c) => c.city),
  is_command: !!data.is_command,
  contact_discord: data.contact_discord || "",
});

function StaffEditor({ initial, isNew, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    certifications: Array.isArray(initial.certifications) ? initial.certifications.join(", ") : initial.certifications || "",
    specialties: Array.isArray(initial.specialties) ? initial.specialties.join(", ") : initial.specialties || "",
    experience_cities: Array.isArray(initial.experience_cities) ? initial.experience_cities : [],
  }));

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const updateCity = (idx, key, val) => {
    setForm((p) => {
      const next = [...(p.experience_cities || [])];
      next[idx] = { ...next[idx], [key]: val };
      return { ...p, experience_cities: next };
    });
  };
  const addCity = () =>
    setForm((p) => ({
      ...p,
      experience_cities: [...(p.experience_cities || []), { city: "", grade: "", months: 0 }],
    }));
  const removeCity = (idx) =>
    setForm((p) => ({
      ...p,
      experience_cities: (p.experience_cities || []).filter((_, i) => i !== idx),
    }));

  return (
    <div
      data-testid="staff-editor"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#0a0a0a] border border-white/15 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#121212]">
          <span className="font-mono-ems text-[10px] tracking-[0.3em] text-white/80">
            {isNew ? "NEW PERSONNEL RECORD" : "EDIT PERSONNEL RECORD"}
          </span>
          <button onClick={onCancel} className="text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldAdmin label="Name" testId="editor-name">
            <input value={form.name} onChange={set("name")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Callsign" testId="editor-callsign">
            <input value={form.callsign} onChange={set("callsign")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Rank">
            <input value={form.rank} onChange={set("rank")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Role">
            <input value={form.role} onChange={set("role")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Badge #">
            <input value={form.badge_number} onChange={set("badge_number")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Years Served">
            <input type="number" value={form.years_served} onChange={set("years_served")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Discord">
            <input value={form.contact_discord} onChange={set("contact_discord")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Photo URL" full>
            <input value={form.photo_url} onChange={set("photo_url")} className={inp} placeholder="https://..." />
          </FieldAdmin>
          <FieldAdmin label="Certifications (comma-separated)" full>
            <input value={form.certifications} onChange={set("certifications")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Specialties (comma-separated)" full>
            <input value={form.specialties} onChange={set("specialties")} className={inp} />
          </FieldAdmin>
          <FieldAdmin label="Bio" full>
            <textarea rows={3} value={form.bio} onChange={set("bio")} className={inp} />
          </FieldAdmin>

          {/* City Experience editor */}
          <div className="md:col-span-2 mt-2 border border-white/10 p-4 bg-[#0d0d0d]" data-testid="editor-cities">
            <div className="flex items-center justify-between mb-3">
              <div className="label-ems flex items-center gap-2">
                <MapPin size={12} /> City Experience
              </div>
              <button
                type="button"
                onClick={addCity}
                data-testid="city-add-btn"
                className="btn-ghost-ems px-3 py-1.5 text-[10px] inline-flex items-center gap-1"
              >
                <Plus size={12} /> Add City
              </button>
            </div>
            {(form.experience_cities || []).length === 0 ? (
              <div className="font-mono-ems text-[10px] text-white/40 tracking-widest py-2">
                NO CITY EXPERIENCE ON FILE
              </div>
            ) : (
              <div className="space-y-2">
                {form.experience_cities.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`city-row-${i}`}>
                    <input
                      placeholder="City name"
                      value={c.city || ""}
                      onChange={(e) => updateCity(i, "city", e.target.value)}
                      className={`${inp} col-span-5`}
                      data-testid={`city-name-${i}`}
                    />
                    <input
                      placeholder="Grade"
                      value={c.grade || ""}
                      onChange={(e) => updateCity(i, "grade", e.target.value)}
                      className={`${inp} col-span-4`}
                      data-testid={`city-grade-${i}`}
                    />
                    <input
                      type="number"
                      placeholder="Months"
                      value={c.months || 0}
                      onChange={(e) => updateCity(i, "months", e.target.value)}
                      className={`${inp} col-span-2`}
                      data-testid={`city-months-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeCity(i)}
                      className="col-span-1 p-2 text-white/60 hover:text-[#ef4444] flex items-center justify-center"
                      data-testid={`city-remove-${i}`}
                      aria-label="Remove city"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 mt-2 md:col-span-2">
            <input
              type="checkbox"
              checked={!!form.is_command}
              onChange={set("is_command")}
              data-testid="editor-iscommand"
              className="w-4 h-4 accent-[#2A6DF4]"
            />
            <span className="font-mono-ems text-[11px] tracking-widest uppercase text-white/80">
              Command Personnel
            </span>
          </label>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost-ems px-4 py-2.5 text-xs inline-flex items-center gap-2">
            <X size={14} /> Cancel
          </button>
          <button
            data-testid="editor-save"
            onClick={() => onSave(form)}
            className="btn-primary-ems px-5 py-2.5 text-xs inline-flex items-center gap-2"
          >
            <Save size={14} /> {isNew ? "Add Staff" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp =
  "w-full bg-[#121212] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-mono-ems focus:outline-none focus:ring-2 focus:ring-[#2A6DF4] focus:border-transparent rounded-sm";

const FieldAdmin = ({ label, children, full, testId }) => (
  <label className={`block ${full ? "md:col-span-2" : ""}`} data-testid={testId}>
    <span className="label-ems block mb-1.5">{label}</span>
    {children}
  </label>
);

// ===================== APPLICATIONS =====================
const STATUS_STYLES = {
  pending: { label: "PENDING", cls: "bg-white/10 text-white/80 border-white/20" },
  interview: { label: "INTERVIEW", cls: "bg-[#FFB703]/10 text-[#FFB703] border-[#FFB703]/40" },
  accepted: { label: "ACCEPTED", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" },
  rejected: { label: "REJECTED", cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40" },
};

function ApplicationsManager({ token, onUnauth }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [drafts, setDrafts] = useState({}); // { [appId]: messageString }

  const auth = { headers: { "X-Admin-Token": token } };

  const load = () => {
    setLoading(true);
    api
      .get("/admin/applications", auth)
      .then((r) => setApps(r.data))
      .catch((e) => {
        if (e?.response?.status === 401) onUnauth();
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const updateStatus = async (app, status) => {
    setUpdatingId(app.id);
    try {
      const message = drafts[app.id] || "";
      const r = await api.patch(`/admin/applications/${app.id}`, { status, message }, auth);
      setApps((prev) => prev.map((a) => (a.id === app.id ? r.data : a)));
      const dmHint = app.discord_user_id ? " · DM sent" : "";
      toast.success(`Marked ${STATUS_STYLES[status]?.label || status}${dmHint}`);
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error(e?.response?.data?.detail || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteApp = async (app) => {
    if (!window.confirm(`Permanently delete application from ${app.full_name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/applications/${app.id}`, auth);
      setApps((prev) => prev.filter((a) => a.id !== app.id));
      toast.success("Application deleted");
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error(e?.response?.data?.detail || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60 font-mono-ems text-sm">
        <Loader2 className="animate-spin" size={16} /> Loading applications...
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="border border-white/10 p-12 text-center text-white/50 font-mono-ems text-xs tracking-widest">
        NO APPLICATIONS RECEIVED YET
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="applications-list">
      {apps.map((a) => {
        const style = STATUS_STYLES[a.status] || STATUS_STYLES.pending;
        const isBusy = updatingId === a.id;
        return (
          <div key={a.id} className="tactical-card p-5" data-testid={`app-${a.id.slice(0, 8)}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="label-ems text-[#2A6DF4]">REF · {a.id.slice(0, 8).toUpperCase()}</div>
                <span className={`font-mono-ems text-[10px] tracking-widest px-2 py-1 border ${style.cls}`}>
                  {style.label}
                </span>
              </div>
              <div className="font-mono-ems text-[10px] text-white/50 uppercase tracking-widest">
                {new Date(a.submitted_at).toLocaleString()}
              </div>
            </div>

            <h3 className="font-display font-bold text-lg mt-3">
              {a.full_name}{" "}
              <span className="text-white/40 text-sm font-normal">· {a.in_game_name}</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <Cell label="Age" value={a.age} />
              <Cell label="Timezone" value={a.timezone} />
              <Cell label="Discord" value={a.discord} />
              <Cell label="Steam" value={a.steam_hex || "—"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-sm">
              <Cell
                label="Discord User ID (for DM)"
                value={a.discord_user_id || "— not provided"}
              />
              <Cell
                label="Last Updated"
                value={a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : "—"}
              />
            </div>

            <div className="mt-3 space-y-2">
              <Block label="Prior Experience" value={a.prior_experience} />
              <Block label="Why Join" value={a.why_join} />
              <Block label="Availability" value={a.availability} />
              {a.review_message && (
                <Block label="Last Review Note" value={a.review_message} />
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <label className="block">
                <span className="label-ems">Message to Applicant (sent to Discord + DM)</span>
                <textarea
                  rows={2}
                  value={drafts[a.id] || ""}
                  onChange={(e) =>
                    setDrafts((p) => ({ ...p, [a.id]: e.target.value }))
                  }
                  placeholder="Optional note — will appear on their status page and in the DM"
                  data-testid={`app-message-${a.id.slice(0, 8)}`}
                  className="mt-2 w-full bg-[#121212] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#2A6DF4]"
                />
              </label>
              <div className="flex flex-wrap gap-2 mt-3">
                <StatusBtn
                  testId={`accept-${a.id.slice(0, 8)}`}
                  busy={isBusy}
                  onClick={() => updateStatus(a, "accepted")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <CheckCircle2 size={14} /> Accept
                </StatusBtn>
                <StatusBtn
                  testId={`interview-${a.id.slice(0, 8)}`}
                  busy={isBusy}
                  onClick={() => updateStatus(a, "interview")}
                  className="bg-[#FFB703] hover:bg-[#e6a700] text-black"
                >
                  <CalendarClock size={14} /> Interview
                </StatusBtn>
                <StatusBtn
                  testId={`reject-${a.id.slice(0, 8)}`}
                  busy={isBusy}
                  onClick={() => updateStatus(a, "rejected")}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
                >
                  <XCircle size={14} /> Reject
                </StatusBtn>
                {a.status !== "pending" && (
                  <StatusBtn
                    testId={`reopen-${a.id.slice(0, 8)}`}
                    busy={isBusy}
                    onClick={() => updateStatus(a, "pending")}
                    className="bg-transparent border border-white/20 hover:bg-white/5 text-white/70"
                  >
                    <Undo2 size={14} /> Re-open
                  </StatusBtn>
                )}
                <StatusBtn
                  testId={`delete-app-${a.id.slice(0, 8)}`}
                  busy={isBusy}
                  onClick={() => deleteApp(a)}
                  className="bg-transparent border border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] ml-auto"
                >
                  <Trash2 size={14} /> Delete
                </StatusBtn>
              </div>
              {!a.discord_user_id && (
                <p className="font-mono-ems text-[10px] text-white/40 mt-3">
                  No Discord User ID on file — applicant won't receive a DM, only the channel embed.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const StatusBtn = ({ busy, onClick, testId, children, className = "" }) => (
  <button
    onClick={onClick}
    disabled={busy}
    data-testid={testId}
    className={`px-4 py-2 inline-flex items-center gap-2 font-display font-bold text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-60 ${className}`}
  >
    {busy ? <Loader2 className="animate-spin" size={14} /> : children}
  </button>
);

const Cell = ({ label, value }) => (
  <div>
    <div className="label-ems">{label}</div>
    <div className="text-white font-mono-ems text-xs mt-0.5">{value}</div>
  </div>
);

const Block = ({ label, value }) => (
  <div>
    <div className="label-ems">{label}</div>
    <div className="text-white/80 text-sm mt-0.5 whitespace-pre-wrap">{value || "—"}</div>
  </div>
);


// ===================== GALLERY MANAGER =====================
function GalleryManager({ token, onUnauth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState(""); // data URL
  const [uploadedBy, setUploadedBy] = useState("Command");

  const auth = { headers: { "X-Admin-Token": token } };

  const load = () => {
    setLoading(true);
    api
      .get("/gallery")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const upload = async () => {
    if (!preview) {
      toast.error("Pick an image first.");
      return;
    }
    setUploading(true);
    try {
      const r = await api.post(
        "/admin/gallery",
        { image_data: preview, caption, uploaded_by: uploadedBy },
        auth
      );
      setItems((prev) => [r.data, ...prev]);
      setPreview("");
      setCaption("");
      toast.success("Uploaded · posted to Discord");
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error(e?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await api.delete(`/admin/gallery/${item.id}`, auth);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Image deleted");
    } catch (e) {
      if (e?.response?.status === 401) onUnauth();
      else toast.error("Delete failed");
    }
  };

  return (
    <section data-testid="gallery-manager">
      <div className="tactical-card p-6">
        <div className="label-ems text-[#2A6DF4] mb-4">UPLOAD · NEW IMAGE</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="label-ems block mb-1.5">Image (max 5 MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                data-testid="gallery-file-input"
                className="block w-full text-xs font-mono-ems text-white/70 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-[#2A6DF4] file:text-white file:font-display file:font-bold file:tracking-wider file:uppercase file:cursor-pointer"
              />
            </label>
            <label className="block mt-3">
              <span className="label-ems block mb-1.5">Caption (optional)</span>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                data-testid="gallery-caption-input"
                placeholder="Vinewood pile-up · 03:42 dispatch"
                className={inp}
              />
            </label>
            <label className="block mt-3">
              <span className="label-ems block mb-1.5">Uploaded By</span>
              <input
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                className={inp}
                data-testid="gallery-uploadedby-input"
              />
            </label>
            <button
              data-testid="gallery-upload-btn"
              disabled={uploading || !preview}
              onClick={upload}
              className="btn-primary-ems px-5 py-3 mt-4 inline-flex items-center gap-2 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
              Upload &amp; Post to Discord
            </button>
          </div>
          <div className="border border-white/10 bg-[#0d0d0d] aspect-square flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="font-mono-ems text-[10px] text-white/40 tracking-widest">
                NO IMAGE SELECTED
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="label-ems mb-3">Gallery · {items.length} image(s)</div>
        {loading ? (
          <div className="flex items-center gap-2 text-white/60 font-mono-ems text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="border border-white/10 p-10 text-center text-white/50 font-mono-ems text-xs tracking-widest">
            NO IMAGES YET
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="gallery-admin-grid">
            {items.map((it) => (
              <div
                key={it.id}
                className="tactical-card relative overflow-hidden"
                data-testid={`gallery-admin-${it.id.slice(0, 8)}`}
              >
                <div className="relative aspect-square bg-[#0d0d0d]">
                  <img
                    src={it.image_data}
                    alt={it.caption}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <button
                    onClick={() => remove(it)}
                    aria-label="Delete"
                    data-testid={`gallery-delete-${it.id.slice(0, 8)}`}
                    className="absolute top-1 right-1 p-1.5 bg-black/70 text-white/80 hover:text-[#ef4444]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                {it.caption && (
                  <div className="px-2 py-1.5 text-[11px] text-white/80 line-clamp-2 border-t border-white/10">
                    {it.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
