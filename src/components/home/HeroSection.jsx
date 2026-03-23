import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { i18n } = useTranslation();
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const docRef = doc(db, 'settings', 'hero');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHeroData(docSnap.data());
        } else {
          // Fallback to old 'storefront' document for backwards compatibility if not yet migrated
          const oldRef = doc(db, 'settings', 'storefront');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().heroLayout) {
            setHeroData(oldSnap.data());
          } else {
            setHeroData({
              heroLayout: 'split',
              heroImage: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80',
              heroBadgeEn: 'SAVOIR FAIRE',
              heroBadgeAr: 'المهارة والحرفية',
              heroTitle1En: 'Timeless',
              heroTitle1Ar: 'أناقة',
              heroTitle2En: 'Elegance',
              heroTitle2Ar: 'خالدة،',
              heroTitle3En: 'Crafted with Care.',
              heroTitle3Ar: 'صُنعت بعناية.',
              heroDescEn: 'Discover our luxury collection of handbags. Designed for the modern woman who appreciates uncompromising quality and refined design.',
              heroDescAr: 'اكتشفي تشكيلتنا الفاخرة من حقائب اليد. مصممة للمرأة العصرية التي تقدر الجودة التي لا تضاهى والتصميم الراقي.',
              heroBtnEn: 'Explore Collection',
              heroBtnAr: 'تصفح التشكيلة',
              heroBtnLink: '/products',
            });
          }
        }
      } catch (err) {
        console.error("Error fetching hero", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  if (loading || !heroData) return <div className="animate-pulse h-[70vh] bg-gray-100 rounded-[2.5rem]"></div>;

  const isAr = i18n.language === 'ar';
  const badge = isAr ? heroData.heroBadgeAr : heroData.heroBadgeEn;
  const t1 = isAr ? heroData.heroTitle1Ar : heroData.heroTitle1En;
  const t2 = isAr ? heroData.heroTitle2Ar : heroData.heroTitle2En;
  const t3 = isAr ? heroData.heroTitle3Ar : heroData.heroTitle3En;
  const desc = isAr ? heroData.heroDescAr : heroData.heroDescEn;
  const btn = isAr ? heroData.heroBtnAr : heroData.heroBtnEn;

  if (heroData.heroLayout === 'full') {
    return (
      <section className="relative rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[70vh] flex items-center py-16">
        <img src={heroData.heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-transparent rtl:bg-gradient-to-l"></div>
        
        <div className="relative z-10 p-8 md:p-16 max-w-3xl">
          {badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 shadow-sm">
              <Sparkles size={16} className="text-amber-300" />
              <span className="text-sm font-semibold tracking-widest text-amber-300 uppercase">{badge}</span>
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] font-serif mb-6 drop-shadow-lg">
            {t1} <br className="hidden md:block" /> {t2} <br />
            <span className="text-amber-300 font-serif italic font-light">{t3}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-xl leading-relaxed font-light mb-8 drop-shadow text-shadow-sm">{desc}</p>
          <div className="pt-4">
            <Link to={heroData.heroBtnLink || '/products'} className="inline-flex items-center gap-3 bg-white hover:bg-amber-500 hover:text-white text-gray-900 font-medium px-8 py-4 rounded-full transition-all duration-300 shadow-xl btn-interact">
              {btn} {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Link>
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <section className="bg-[#fcfbf9] rounded-[2.5rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-sm border border-[#f3eee8]">
        <div className={`absolute top-0 w-1/2 h-full bg-[#faeff0] opacity-30 mix-blend-multiply ${isAr ? 'left-0 rounded-r-[4rem]' : 'right-0 rounded-l-[4rem]'}`}></div>
        <div className={`md:w-1/2 space-y-8 relative z-10 ${isAr ? 'pl-8' : 'pr-8'}`}>
          {badge && (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm">
               <Sparkles size={16} className="text-[#a2845e]" />
               <span className="text-sm font-semibold tracking-widest text-[#a2845e] uppercase">{badge}</span>
             </div>
          )}
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] font-serif">
            {t1} <br className="hidden md:block" /> {t2} <br />
            <span className="text-[#a2845e] font-serif italic font-light">{t3}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md leading-relaxed font-light">{desc}</p>
          <div className="pt-4">
            <Link to={heroData.heroBtnLink || '/products'} className="inline-flex items-center gap-3 bg-gray-900 hover:bg-[#a2845e] text-white font-medium px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-gray-900/10 hover:shadow-2xl hover:shadow-[#a2845e]/20 hover:-translate-y-1 btn-interact">
              {btn} {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 mt-16 md:mt-0 flex justify-center relative z-10 h-full">
          <div className="w-full max-w-[500px] aspect-[4/5] bg-gray-100 rounded-[3rem] shadow-2xl overflow-hidden relative group">
            <img src={heroData.heroImage} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </section>
    );
  }
}
