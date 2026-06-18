import { motion } from "framer-motion";
import { forwardRef } from "react";

// Vertical EMS ID badge
const IdCard = forwardRef(function IdCard({ data }, ref) {
  const {
    full_name = "RECRUIT NAME",
    callsign = "EMS-XX",
    rank = "PROBATIONARY EMT",
    badge_number = "P-000",
    blood_type = "O+",
    photo_url = "",
    issued = new Date().toISOString().slice(0, 10),
    expires = "2099-12-31",
    division = "TEAM PILLBOX",
  } = data;

  // Compact barcode
  const bars = Array.from({ length: 36 }, (_, i) =>
    [1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3][i % 12]
  );

  return (
    <motion.div
      whileHover={{ rotateY: 6, rotateX: -4 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className="w-[320px] mx-auto"
    >
      <div
        ref={ref}
        data-testid="id-card-preview"
        className="relative w-[320px] bg-[#0d0d0d] text-white border border-white/15 shadow-[0_30px_80px_-20px_rgba(42,109,244,0.35)] overflow-hidden flex flex-col"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 cross-pattern opacity-50 pointer-events-none" />
        <div className="noise absolute inset-0 pointer-events-none" />

        {/* Top stripe */}
        <div className="relative h-12 bg-[#2A6DF4] flex items-center justify-between px-3 border-b-2 border-black z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white flex items-center justify-center p-0.5">
              <img
                src="/assets/pillbox-logo.webp"
                alt="logo"
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-black text-[11px] tracking-widest">
              {division}
            </span>
          </div>
          <span className="font-mono-ems text-[9px] tracking-widest">FIVEM·RP</span>
        </div>

        {/* Photo — fixed height keeps things from blowing up on export */}
        <div className="relative mx-3 mt-3 h-[170px] bg-[#121212] border border-white/15 overflow-hidden z-10">
          {photo_url ? (
            <img
              src={photo_url}
              alt={full_name}
              className="absolute inset-0 w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono-ems text-[10px] text-white/40 tracking-widest">
              [ NO PHOTO ]
            </div>
          )}
          <div className="scanlines absolute inset-0 pointer-events-none" />
          <div className="absolute top-1 right-1 font-mono-ems text-[8px] tracking-widest text-white bg-black/70 px-1.5 py-0.5">
            ID·{badge_number}
          </div>
        </div>

        {/* Name + rank */}
        <div className="px-3 mt-3 relative z-10">
          <div className="label-ems text-white/50">NAME</div>
          <div className="font-display font-black text-base uppercase tracking-tight leading-tight truncate">
            {full_name}
          </div>
          <div className="label-ems text-white/50 mt-2">RANK</div>
          <div className="font-display font-bold text-[11px] uppercase tracking-wider text-[#FFB703] truncate">
            {rank}
          </div>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-3 gap-2 px-3 mt-3 font-mono-ems text-[9px] relative z-10">
          <div>
            <div className="text-white/40 tracking-widest">CALL</div>
            <div className="text-white tracking-wider truncate">{callsign}</div>
          </div>
          <div>
            <div className="text-white/40 tracking-widest">BLOOD</div>
            <div className="text-white tracking-wider truncate">{blood_type}</div>
          </div>
          <div>
            <div className="text-white/40 tracking-widest">BADGE</div>
            <div className="text-white tracking-wider truncate">{badge_number}</div>
          </div>
          <div>
            <div className="text-white/40 tracking-widest">ISSUED</div>
            <div className="text-white tracking-wider truncate">{issued}</div>
          </div>
          <div className="col-span-2">
            <div className="text-white/40 tracking-widest">EXPIRES</div>
            <div className="text-white tracking-wider truncate">{expires}</div>
          </div>
        </div>

        {/* Barcode — flow-positioned, not absolute, so it cannot overlap */}
        <div className="px-3 mt-4 mb-3 relative z-10">
          <div className="flex items-end gap-[1.5px] h-7">
            {bars.map((h, i) => (
              <div
                key={i}
                style={{ width: 2, height: `${h * 22 + 18}%` }}
                className={i % 3 === 0 ? "bg-white" : "bg-white/80"}
              />
            ))}
          </div>
          <div className="font-mono-ems text-[8px] tracking-[0.3em] text-white/50 mt-1 text-center truncate">
            PILLBOX-EMS-{badge_number}
          </div>
        </div>

        {/* Corner ticks */}
        <span className="absolute top-1 left-1 w-3 h-3 border-l border-t border-white/30" />
        <span className="absolute top-1 right-1 w-3 h-3 border-r border-t border-white/30" />
        <span className="absolute bottom-1 left-1 w-3 h-3 border-l border-b border-white/30" />
        <span className="absolute bottom-1 right-1 w-3 h-3 border-r border-b border-white/30" />
      </div>
    </motion.div>
  );
});

export default IdCard;
