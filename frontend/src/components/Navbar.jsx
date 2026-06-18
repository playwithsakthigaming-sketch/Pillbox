import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", id: "nav-home" },
  { to: "/staff", label: "Roster", id: "nav-staff" },
  { to: "/gallery", label: "Gallery", id: "nav-gallery" },
  { to: "/apply", label: "Join Us", id: "nav-apply" },
  { to: "/status", label: "Status", id: "nav-status" },
];

export default function Navbar() {
  return (
    <nav
      data-testid="main-navbar"
      className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link
          to="/"
          data-testid="navbar-logo"
          className="flex items-center gap-3 group"
        >
          <span className="relative flex items-center justify-center w-10 h-10 bg-white/5 border border-white/10 p-1">
            <img
              src="/assets/pillbox-logo.webp"
              alt="Team Pillbox"
              className="w-full h-full object-contain"
            />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black tracking-tight text-base text-white">
              TEAM PILLBOX
            </span>
            <span className="font-mono-ems text-[9px] tracking-[0.3em] text-[#A3A3A3]">
              EMS · DIVISION
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={l.id}
              className={({ isActive }) =>
                `px-4 py-2 text-xs font-display font-bold uppercase tracking-[0.18em] transition-colors ${
                  isActive
                    ? "text-white bg-white/5 border-b-2 border-[#2A6DF4]"
                    : "text-white/70 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 font-mono-ems text-[10px] text-[#A3A3A3]">
          <span className="w-2 h-2 bg-[#22c55e] rounded-full ems-pulse" />
          <span data-testid="navbar-status">10-8 IN SERVICE</span>
        </div>

        <Link
          to="/apply"
          data-testid="navbar-cta"
          className="md:hidden btn-primary-ems text-xs px-3 py-2"
        >
          Apply
        </Link>
      </div>
    </nav>
  );
}
