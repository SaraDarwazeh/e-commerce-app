import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

// Get language from localStorage, or default to 'en'
const savedLanguage = localStorage.getItem('appLanguage') || 'en';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: enTranslations,
            ar: arTranslations
        },
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes values
        }
    });

// Setup initial direction based on language
document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

i18n.on('languageChanged', (lng) => {
    localStorage.setItem('appLanguage', lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
});

export default i18n;
