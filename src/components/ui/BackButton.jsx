import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function BackButton({ label, className = "" }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const displayLabel = label || t('common.back', 'Back');
  const isRTL = i18n.dir() === 'rtl';

  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ${className}`}
    >
      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      {displayLabel}
    </button>
  );
}
