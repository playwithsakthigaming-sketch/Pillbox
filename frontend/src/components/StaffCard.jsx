import { motion } from "framer-motion";

export default function StaffCard({ staff, index = 0, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid={`staff-card-${staff.callsign}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={`group text-left tactical-card relative overflow-hidden ${
        staff.is_command ? "border-t-2 border-t-[#2A6DF4]" : ""
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0d0d0d]">
        <img
          src={staff.photo_url}
          alt={staff.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={`w-2 h-2 ${
              staff.is_command ? "bg-[#2A6DF4]" : "bg-emerald-400"
            } ems-pulse`}
          />
          <span className="font-mono-ems text-[10px] tracking-[0.2em] text-white/80 bg-black/50 px-2 py-0.5 backdrop-blur-sm">
            {staff.callsign}
          </span>
        </div>
        {staff.is_command && (
          <span className="absolute top-3 right-3 font-mono-ems text-[9px] tracking-[0.2em] text-[#FFB703] bg-black/60 px-2 py-0.5 border border-[#FFB703]/40">
            SPECIALTIES
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="label-ems text-white/60">{staff.rank}</div>
          <h3 className="font-display font-bold text-white text-lg leading-tight mt-1">
            {staff.name}
          </h3>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between font-mono-ems text-[10px] uppercase tracking-widest">
        <span className="text-white/60">{staff.role}</span>
        <span className="text-[#2A6DF4] group-hover:translate-x-1 transition-transform">
          VIEW →
        </span>
      </div>
    </motion.button>
  );
}
