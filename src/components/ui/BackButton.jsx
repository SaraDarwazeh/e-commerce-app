import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function BackButton({ label = "Back", className = "" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors ${className}`}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  );
}
