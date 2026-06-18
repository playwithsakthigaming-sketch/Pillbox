import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { Image as ImageIcon, Loader2, X as XIcon } from "lucide-react";

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    api
      .get("/gallery")
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="gallery-page" className="text-white pt-28 pb-24">
      <header className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-3 font-mono-ems text-[10px] tracking-[0.3em] text-[#2A6DF4]">
          <span className="w-2 h-2 bg-[#2A6DF4] ems-pulse" />
          MEDIA · DEPARTMENT GALLERY
        </div>
        <h1 className="h1-ems text-5xl md:text-7xl mt-3">
          ON-SCENE <span className="text-[#2A6DF4]">FEED</span>
        </h1>
        <p className="text-white/70 mt-3 max-w-xl">
          Photos from training drills, mass-casualty responses, and downtime at Pillbox station.
          Curated by command.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 mt-10">
        {loading ? (
          <div className="flex items-center gap-2 text-white/60 font-mono-ems text-sm">
            <Loader2 className="animate-spin" size={16} /> Loading gallery...
          </div>
        ) : items.length === 0 ? (
          <div className="border border-white/10 p-16 text-center" data-testid="gallery-empty">
            <ImageIcon size={28} className="mx-auto text-white/40" />
            <div className="font-mono-ems text-[10px] tracking-widest text-white/50 uppercase mt-3">
              NO IMAGES YET
            </div>
            <p className="text-white/60 text-sm mt-2">
              Command hasn't posted anything yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="gallery-grid">
            {items.map((it, i) => (
              <motion.button
                type="button"
                key={it.id}
                onClick={() => setLightbox(it)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                data-testid={`gallery-item-${it.id.slice(0, 8)}`}
                className="group tactical-card relative overflow-hidden text-left"
              >
                <div className="relative aspect-square bg-[#0d0d0d]">
                  <img
                    src={it.image_data}
                    alt={it.caption || "gallery"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="scanlines absolute inset-0 pointer-events-none" />
                </div>
                {it.caption && (
                  <div className="px-3 py-2 border-t border-white/10 text-xs text-white/80 line-clamp-2">
                    {it.caption}
                  </div>
                )}
                <div className="px-3 py-1.5 border-t border-white/10 flex items-center justify-between font-mono-ems text-[9px] uppercase tracking-widest text-white/40">
                  <span>{it.source}</span>
                  <span>{new Date(it.created_at).toLocaleDateString()}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="gallery-lightbox"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
            data-testid="lightbox-close"
          >
            <XIcon size={24} />
          </button>
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.image_data}
              alt={lightbox.caption || "gallery"}
              className="w-full max-h-[80vh] object-contain border border-white/15"
            />
            {lightbox.caption && (
              <div className="mt-3 font-mono-ems text-xs text-white/80 px-2">
                {lightbox.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
