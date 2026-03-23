import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBanners } from '../../services/bannerService';

export default function BannersSection() {
  const [banners, setBanners] = useState([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchBanners = async () => {
      try {
        const promoBanners = await getBanners(true);
        if (active) {
            setBanners(promoBanners);
        }
      } catch (err) {
        console.error("Error fetching banners", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBanners();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  return (
    <section className="relative rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 group bg-gray-900 h-[60vh] min-h-[400px]">
      {banners.map((banner, idx) => (
        <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={banner.image} alt={banner.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent"></div>
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-center max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tight leading-tight drop-shadow-lg">{banner.title}</h2>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-lg font-light">{banner.subtitle}</p>
            <div>
              <Link to={banner.ctaLink} className="inline-block bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-full transition-colors shadow-xl btn-interact">{banner.ctaText}</Link>
            </div>
          </div>
        </div>
      ))}
      {banners.length > 1 && (
        <>
          <button onClick={() => setCurrentBannerIdx((p) => p === 0 ? banners.length - 1 : p - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setCurrentBannerIdx((p) => (p + 1) % banners.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-20 transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentBannerIdx(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentBannerIdx ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
