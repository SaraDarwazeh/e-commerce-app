import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-600 hover:text-brand-600 transition-colors focus:outline-none p-2"
                aria-label="Change Language"
            >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium uppercase">{i18n.language}</span>
            </button>

            {isOpen && (
                <div className={`absolute ${i18n.language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-2 w-32 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50`}>
                    <button
                        onClick={() => toggleLanguage('en')}
                        className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => toggleLanguage('ar')}
                        className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'ar' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                        dir="rtl"
                    >
                        العربية
                    </button>
                </div>
            )}
        </div>
    );
}
