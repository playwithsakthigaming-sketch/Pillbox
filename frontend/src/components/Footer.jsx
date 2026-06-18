import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer
      data-testid="main-footer"
      className="border-t border-white/10 bg-[#0a0a0a] mt-24"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-[#E63946] text-white">
                <Activity size={16} strokeWidth={3} />
              </span>
              <span className="font-display font-black tracking-tight text-white">
                TEAM PILLBOX · EMS
              </span>
            </div>
            <p className="text-sm text-white/60 max-w-md">
              The Emergency Medical Services division of the Pillbox Hill response unit.
              Operating across Los Santos and Blaine County in the FiveM RP community.
            </p>
            <div className="font-mono-ems text-[10px] text-white/40 pt-2">
              <span className="text-[#E63946]">●</span> ON-AIR · DISPATCH-7 ·
              SECTOR L-S
            </div>
          </div>

          <div className="space-y-2">
            <div className="label-ems">Sections</div>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link to="/" className="text-white/70 hover:text-white">Home</Link>
              <Link to="/staff" className="text-white/70 hover:text-white">Roster</Link>
              <Link to="/id-card" className="text-white/70 hover:text-white">ID Card</Link>
              <Link to="/apply" className="text-white/70 hover:text-white">Join Us</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="label-ems">Frequencies</div>
            <div className="font-mono-ems text-xs text-white/60 space-y-1">
              <div>EMS-PRIMARY · 462.150</div>
              <div>DISPATCH · 460.025</div>
              <div>AIR-RESCUE · 467.500</div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-mono-ems text-[10px] text-white/40 uppercase tracking-widest">
            © Team Pillbox EMS — FiveM RP fan project. Not affiliated with Rockstar Games.
          </span>
          <span className="font-mono-ems text-[10px] text-white/40 uppercase tracking-widest">
            DOC-V1.0 · SIG-PILLBOX-EMS
          </span>
        </div>
      </div>
    </footer>
  );
}
