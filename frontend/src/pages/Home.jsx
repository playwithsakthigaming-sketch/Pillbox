import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { ArrowRight, Activity, Radio, Award, MapPin } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    active_personnel: 0,
    teams_in_cities: 0,
    years_in_service: 0,
  });

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page" className="text-white">
      {/* HERO */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1605702012553-e954fbde66eb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxncml0dHklMjBjaXR5JTIwbmlnaHQlMjBza3lsaW5lfGVufDB8fHx8MTc4MTc4OTIwNXww&ixlib=rb-4.1.0&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        <div className="absolute inset-0 cross-pattern opacity-30" />
        <div className="scanlines absolute inset-0 pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-24 pt-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white/5 border border-white/15 p-2 backdrop-blur-sm"
          >
            <img
              src="/assets/pillbox-logo.webp"
              alt="Team Pillbox logo"
              className="w-full h-full object-contain"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]"
          >
            <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
            DISPATCH · LIVE · SECTOR LOS SANTOS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="h1-ems text-6xl md:text-8xl lg:text-9xl mt-4"
          >
            TEAM
            <br />
            <span className="text-[#2A6DF4]">PILLBOX</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-base md:text-lg text-white/75 leading-relaxed"
          >
            FiveM Roleplay Emergency Medical Services. We respond when the city falls apart —
            highway pile-ups, alley overdoses, mass-casualty incidents. Around the clock,
            on every channel, every night.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              to="/apply"
              data-testid="hero-apply-btn"
              className="btn-primary-ems px-6 py-3.5 inline-flex items-center gap-2"
            >
              Apply To Join <ArrowRight size={16} />
            </Link>
            <Link
              to="/staff"
              data-testid="hero-roster-btn"
              className="btn-ghost-ems px-6 py-3.5 inline-flex items-center gap-2"
            >
              View Roster
            </Link>
            <Link
              to="/idcard"
              data-testid="hero-idcard-btn"
              className="btn-ghost-ems px-6 py-3.5 inline-flex items-center gap-2"
            >
              ID Generator
            </Link>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10"
          >
            <Stat icon={<Activity size={14} />} label="Active Personnel" value={stats.active_personnel} testId="stat-personnel" />
            <Stat icon={<MapPin size={14} />} label="Teams In Cities" value={stats.teams_in_cities} testId="stat-cities" />
            <Stat icon={<Award size={14} />} label="Years In Service" value={stats.years_in_service} testId="stat-years" />
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-white/10 bg-[#0d0d0d] overflow-hidden">
        <div className="marquee-track flex whitespace-nowrap font-display font-black text-3xl md:text-5xl uppercase py-4 text-white/30 gap-12">
          {Array(2)
            .fill(null)
            .map((_, repeat) => (
              <div key={repeat} className="flex gap-12">
                <span>● ON THE AIR</span>
                <span className="text-[#2A6DF4]">● PILLBOX EMS</span>
                <span>● RESPONDING CODE 3</span>
                <span className="text-[#FFB703]">● TRAINING ACADEMY OPEN</span>
                <span>● 24/7 DISPATCH</span>
                <span className="text-[#2A6DF4]">● JOIN THE DEPARTMENT</span>
              </div>
            ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <div className="label-ems">PROTOCOL // 01</div>
            <h2 className="h2-ems text-4xl mt-2">Who We Are</h2>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pillars.map((p) => (
              <div key={p.title} className="tactical-card p-5 relative">
                <span className="absolute top-3 right-3 font-mono-ems text-[10px] text-white/30">
                  0{p.n}
                </span>
                <p.icon size={20} className="text-[#2A6DF4]" />
                <h3 className="font-display font-bold text-lg mt-3">{p.title}</h3>
                <p className="text-sm text-white/65 mt-2 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="relative overflow-hidden border border-white/10 bg-gradient-to-r from-[#061a3a] via-[#0a0a0a] to-[#0a0a0a]">
          <div className="absolute inset-0 cross-pattern opacity-20" />
          <div className="relative p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="label-ems text-[#2A6DF4]">RECRUITMENT // OPEN</div>
              <h2 className="h2-ems text-4xl md:text-5xl mt-3">
                Ready to wear the patch?
              </h2>
              <p className="text-white/70 mt-4 max-w-md">
                We run a real academy. Real protocols. Real consequences. If you want a
                department that takes RP seriously — submit your application.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link
                to="/apply"
                data-testid="cta-apply-btn"
                className="btn-primary-ems px-7 py-4 inline-flex items-center gap-2"
              >
                Submit Application <ArrowRight size={16} />
              </Link>
              <Link
                to="/idcard"
                data-testid="cta-id-btn"
                className="btn-ghost-ems px-7 py-4 inline-flex items-center gap-2"
              >
                Generate ID Card
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const Stat = ({ icon, label, value, testId }) => (
  <div className="bg-[#0a0a0a] p-5">
    <div className="flex items-center gap-2 text-[#2A6DF4]">
      {icon}
      <span className="label-ems text-[#2A6DF4]/80">{label}</span>
    </div>
    <div
      data-testid={testId}
      className="font-display font-black text-3xl mt-1 tracking-tight"
    >
      {value}
    </div>
  </div>
);

const pillars = [
  {
    n: 1,
    title: "Field-Tested",
    body: "Years of in-server response. Every call logged. Every lesson kept in the playbook.",
    icon: Activity,
  },
  {
    n: 2,
    title: "Real Training",
    body: "Multi-week academy with skill checks, scenario drills, and a final field evaluation.",
    icon: Award,
  },
  {
    n: 3,
    title: "Tight Comms",
    body: "Dedicated dispatch, primary and tactical frequencies, and full integration with PD and Fire.",
    icon: Radio,
  },
];
