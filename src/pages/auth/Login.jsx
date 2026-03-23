import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signIn, signInWithGoogle, createRecaptchaVerifier, sendPhoneOTP, verifyPhoneOTP } from '../../services/authService';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { sanitizeInput } from '../../utils/validation';

const COUNTRY_CODES = [
  { code: '+972', label: '🇮🇱 +972' },
  { code: '+970', label: '🇵🇸 +970' },
  { code: '+962', label: '🇯🇴 +962' },
  { code: '+961', label: '🇱🇧 +961' },
  { code: '+966', label: '🇸🇦 +966' },
  { code: '+20',  label: '🇪🇬 +20'  },
  { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+44',  label: '🇬🇧 +44'  },
];

const AUTH_ERRORS = {
  'auth/invalid-email':              { en: 'Invalid email address.',            ar: 'البريد الإلكتروني غير صحيح.' },
  'auth/user-not-found':             { en: 'No account found with this email.', ar: 'لا يوجد حساب بهذا البريد.' },
  'auth/wrong-password':             { en: 'Wrong password.',                   ar: 'كلمة المرور غير صحيحة.' },
  'auth/invalid-credential':         { en: 'Invalid email or password.',        ar: 'بيانات الدخول غير صحيحة.' },
  'auth/too-many-requests':          { en: 'Too many attempts. Try again later.',ar: 'محاولات كثيرة. حاول لاحقاً.' },
  'auth/invalid-phone-number':       { en: 'Invalid phone number.',             ar: 'رقم الهاتف غير صحيح.' },
  'auth/invalid-verification-code':  { en: 'Incorrect OTP code.',              ar: 'رمز التحقق غير صحيح.' },
  'auth/code-expired':               { en: 'OTP expired. Request a new one.',  ar: 'انتهت صلاحية الرمز.' },
  'auth/popup-closed-by-user':       { en: 'Google sign-in cancelled.',         ar: 'تم إلغاء الدخول بجوجل.' },
  'auth/missing-phone-number':       { en: 'Phone number is required.',         ar: 'رقم الهاتف مطلوب.' },
  'auth/quota-exceeded':             { en: 'SMS quota exceeded. Try again later.', ar: 'تجاوز الحد. حاول لاحقاً.' },
  'auth/unauthorized-domain':        { en: 'This domain is not authorized in Firebase Console.', ar: 'هذا النطاق غير مصرح به في إعدادات فيسبوك.' },
};

function getError(err, lang) {
  // If it's a custom error from our service with a string message
  if (typeof err === 'string') return err;
  if (err.message && (err.message.includes('reCAPTCHA') || err.message.includes('E.164'))) return err.message;
  
  const entry = AUTH_ERRORS[err.code];
  if (entry) return lang === 'ar' ? entry.ar : entry.en;
  return lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.';
}

export default function Login() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === 'ar';

  const [tab, setTab]   = useState('email');  
  const [step, setStep] = useState('input');  

  // Email
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Phone
  const [countryCode, setCountryCode]             = useState('+972');
  const [phoneLocal, setPhoneLocal]               = useState('');
  const [otp, setOtp]                             = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [error, setError]     = useState('');
  const [isLoading, setLoading] = useState(false);

  const recaptchaContainerRef = useRef(null);
  const verifierRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const from = location.state?.from?.pathname || '/';

  // Initialize reCAPTCHA once per mount
  useEffect(() => {
    if (tab === 'phone' && !verifierRef.current && recaptchaContainerRef.current) {
      verifierRef.current = createRecaptchaVerifier(recaptchaContainerRef.current);
    }
    
    return () => {
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch (_) {}
        verifierRef.current = null;
      }
    };
  }, [tab]); // Re-init if switching back to phone tab

  // ─── Email login ──────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanEmail = sanitizeInput(email);
      const { user, userProfile } = await signIn(cleanEmail, password);
      setUser(user, userProfile);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanPhone = phoneLocal.replace(/\D/g, '').replace(/^0/, '');
    if (!cleanPhone) {
      setError(isRTL ? 'أدخل رقم الهاتف.' : 'Enter your phone number.');
      return;
    }

    if (!verifierRef.current) {
      // Try one more time to create it
      verifierRef.current = createRecaptchaVerifier(recaptchaContainerRef.current);
      if (!verifierRef.current) {
        setError(isRTL
          ? 'حدث خطأ في تحميل reCAPTCHA. يرجى تعطيل مانع الإعلانات وإعادة تحميل الصفحة.'
          : 'reCAPTCHA failed to load. Please disable ad-blockers and reload.');
        return;
      }
    }

    const fullPhone = `${countryCode}${cleanPhone}`;
    setLoading(true);
    try {
      const result = await sendPhoneOTP(fullPhone, verifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err) {
      console.error('[Login] sendPhoneOTP failed:', err);
      setError(getError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 6) {
      setError(isRTL ? 'أدخل الرمز المكون من 6 أرقام.' : 'Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { user, userProfile } = await verifyPhoneOTP(confirmationResult, otp);
      setUser(user, userProfile);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  // ─── Google ───────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { user, userProfile } = await signInWithGoogle();
      setUser(user, userProfile);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { 
    setTab(t); 
    setStep('input'); 
    setError(''); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500">
            {isRTL ? 'أنشئ حساباً' : 'Create one'}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {['email', 'phone'].map(t => (
              <button key={t} type="button" onClick={() => switchTab(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {t === 'email'
                  ? (isRTL ? 'البريد الإلكتروني' : 'Email')
                  : (isRTL ? 'رقم الهاتف' : 'Phone')}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm leading-relaxed">
              {error}
            </div>
          )}

          {/* ── EMAIL ── */}
          {tab === 'email' && (
            <form className="space-y-5" onSubmit={handleEmailLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'كلمة المرور' : 'Password'}
                </label>
                <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Link>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {isLoading ? (isRTL ? 'جاري الدخول...' : 'Signing in…') : (isRTL ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            </form>
          )}

          {/* ── PHONE: enter number ── */}
          {tab === 'phone' && step === 'input' && (
            <form className="space-y-5" onSubmit={handleSendOTP}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'رقم الهاتف' : 'Phone number'}
                </label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-brand-500">
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                  <input type="tel" required placeholder={isRTL ? 'مثال: 501234567' : 'e.g. 501234567'}
                    value={phoneLocal} onChange={e => setPhoneLocal(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 sm:text-sm" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {isRTL ? 'سيتم إرسال رمز تحقق لرقمك.' : 'A 6-digit verification code will be sent to your number.'}
                </p>
              </div>

              {/* Invisible reCAPTCHA container inside the form */}
              <div ref={recaptchaContainerRef} className="mt-2" />

              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {isLoading ? (isRTL ? 'جاري الإرسال...' : 'Sending…') : (isRTL ? 'إرسال رمز التحقق' : 'Send Verification Code')}
              </button>
            </form>
          )}

          {/* ── PHONE: enter OTP ── */}
          {tab === 'phone' && step === 'otp' && (
            <form className="space-y-5" onSubmit={handleVerifyOTP}>
              <p className="text-sm text-gray-600">
                {isRTL
                  ? `تم إرسال رمز إلى ${countryCode}${phoneLocal}`
                  : `Code sent to ${countryCode}${phoneLocal}`}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL ? 'رمز التحقق (6 أرقام)' : 'Verification code (6 digits)'}
                </label>
                <input type="text" inputMode="numeric" required maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-brand-500" />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {isLoading ? (isRTL ? 'جاري التحقق...' : 'Verifying…') : (isRTL ? 'تحقق وادخل' : 'Verify & Sign In')}
              </button>
              <button type="button" onClick={() => { setStep('input'); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 underline">
                {isRTL ? 'تغيير الرقم' : 'Change number'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400">{isRTL ? 'أو' : 'or'}</span>
            </div>
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isRTL ? 'الدخول بجوجل' : 'Continue with Google'}
          </button>

        </div>
      </div>
    </div>
  );
}
