import useUIStore from '../../store/uiStore';
import { XCircle, CheckCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  const getIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'error': return 'bg-white border-l-4 border-l-red-500 text-gray-800';
      case 'success': return 'bg-white border-l-4 border-l-green-500 text-gray-800';
      default: return 'bg-white border-l-4 border-l-blue-500 text-gray-800';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border border-gray-100 ${getBg(toast.type)} animate-in slide-in-from-bottom-5 fade-in duration-300`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1 font-medium text-sm">
            {toast.message}
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
