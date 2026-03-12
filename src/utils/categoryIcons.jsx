import { Briefcase, ShoppingBag, Grid, Compass, Sparkles, Feather } from 'lucide-react';

export const getCategoryIcon = (slug) => {
  if (!slug) return <ShoppingBag size={20} />;
  const s = slug.toLowerCase();

  if (s.includes('tote')) return <Grid size={20} />;
  if (s.includes('crossbody')) return <Compass size={20} />;
  if (s.includes('evening') || s.includes('clutch')) return <Sparkles size={20} />;
  if (s.includes('backpack')) return <Briefcase size={20} />;
  if (s.includes('mini')) return <Feather size={20} />;

  return <ShoppingBag size={20} />;
};
