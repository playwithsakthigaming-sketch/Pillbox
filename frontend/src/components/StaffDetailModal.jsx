import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Award, Clock, MapPin, Shield } from "lucide-react";

const Row = ({ label, value, mono = true, testId }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="label-ems">{label}</span>
    <span
      data-testid={testId}
      className={`text-white text-sm ${mono ? "font-mono-ems" : ""}`}
    >
      {value}
    </span>
  </div>
);

export default function StaffDetailModal({ staff, open, onOpenChange }) {
  if (!staff) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="staff-detail-modal"
        className="max-w-3xl bg-[#0a0a0a] border border-white/10 p-0 overflow-hidden text-white rounded-sm"
      >
        <DialogTitle className="sr-only">{staff.name} — {staff.rank}</DialogTitle>

        {/* Terminal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
            <span className="font-mono-ems text-[10px] tracking-[0.3em] text-white/80">
              MDT // EMS_PERSONNEL_RECORD
            </span>
          </div>
          <span className="font-mono-ems text-[10px] text-white/40">
            RECORD #{staff.badge_number}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Photo */}
          <div className="md:col-span-2 relative bg-[#0d0d0d] aspect-square md:aspect-auto">
            <img
              src={staff.photo_url}
              alt={staff.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3">
              <div className="font-mono-ems text-[10px] tracking-[0.2em] text-[#2A6DF4] bg-black/60 px-2 py-0.5 inline-block">
                {staff.callsign}
              </div>
            </div>
            <div className="scanlines absolute inset-0 pointer-events-none" />
          </div>

          {/* Details */}
          <div className="md:col-span-3 p-6">
            <div className="label-ems text-[#2A6DF4]">{staff.rank}</div>
            <h2 className="font-display font-black text-3xl mt-1 uppercase tracking-tight leading-none">
              {staff.name}
            </h2>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">{staff.bio}</p>

            <div className="mt-6 grid grid-cols-2 gap-x-6">
              <Row testId="staff-detail-badge" label="Badge" value={staff.badge_number} />
              <Row testId="staff-detail-callsign" label="Callsign" value={staff.callsign} />
              <Row testId="staff-detail-years" label="Years Served" value={staff.years_served} />
              <Row testId="staff-detail-role" label="Role" value={staff.role} mono={false} />
              <Row testId="staff-detail-discord" label="Discord" value={staff.contact_discord || "—"} />
            </div>

            <div className="mt-6">
              <div className="label-ems flex items-center gap-2">
                <Award size={12} /> Certifications
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {staff.certifications.map((c) => (
                  <span
                    key={c}
                    className="font-mono-ems text-[10px] tracking-wider uppercase px-2 py-1 border border-white/15 text-white/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="label-ems flex items-center gap-2">
                <Shield size={12} /> Specialties
              </div>
              <ul className="mt-2 space-y-1 text-sm text-white/80">
                {staff.specialties.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-[#2A6DF4]">▸</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {staff.experience_cities && staff.experience_cities.length > 0 && (
              <div className="mt-4" data-testid="staff-detail-cities">
                <div className="label-ems flex items-center gap-2">
                  <MapPin size={12} /> City Experience
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {staff.experience_cities.map((c, i) => (
                    <div
                      key={`${c.city}-${i}`}
                      className="flex items-center justify-between gap-3 border border-white/10 bg-[#0d0d0d] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-[#2A6DF4]" />
                        <span className="font-display font-bold text-sm">{c.city}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono-ems text-[11px] text-white/70">
                        {c.grade && (
                          <span className="px-2 py-0.5 border border-white/15 uppercase tracking-wider">
                            {c.grade}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} /> {c.months} mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
