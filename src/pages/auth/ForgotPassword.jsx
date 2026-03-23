import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordResetOTP, verifyOTPOnly, verifyOTPAndResetPassword } from '../../services/authService';
import { useTranslation } from 'react-i18next';
import { Mail, KeyRound, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const isRTL = lang === 'ar';
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Helpers
  const handleError = (err) => {
    console.error(err);
    // Extract Firebase Cloud Function error message if available
    const msg = err?.message || err?.details?.message || err?.toString() || 'An error occurred';
    setError(
      isRTL 
      ? (msg.includes('user') ? 'لم يتم العثور على حساب بهذا البريد.' 
         : msg.includes('OTP') ? 'رمز التحقق غير صحيح أو منتهي الصلاحية.' 
         : 'حدث خطأ. يرجى المحاولة مرة أخرى.')
      : msg
    );
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await requestPasswordResetOTP(email, lang);
      if (res.previewUrl) {
        console.log("DEV Preview URL:", res.previewUrl, "DEV OTP:", res.devOtp);
      }
      setStep(2);
      setMessage(isRTL ? 'تم إرسال الرمز إلى بريدك الإلكتروني.' : 'OTP sent to your email.');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError(isRTL ? 'يجب أن يتكون الرمز من 6 أرقام.' : 'OTP must be 6 digits.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await verifyOTPOnly(email, otp);
      setStep(3);
      setMessage(isRTL ? 'تم التحقق بنجاح. أدخل كلمة المرور الجديدة.' : 'OTP verified. Enter your new password.');
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isRTL ? 'كلمات المرور غير متطابقة.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await verifyOTPAndResetPassword(email, otp, newPassword);
      setStep(4);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRTL ? 'استعادة كلمة المرور' : 'Reset your password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 && (isRTL ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق.' : "Enter your email and we'll send an OTP.")}
          {step === 2 && (isRTL ? 'أدخل رمز التحقق الذي وصلك.' : "Enter the verification code sent to your email.")}
          {step === 3 && (isRTL ? 'قم بإنشاء كلمة مرور جديدة قوية.' : "Create a new strong password.")}
          {step === 4 && (isRTL ? 'اكتمل بنجاح!' : "Success!")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 relative overflow-hidden">
          
          {/* Progress Bar */}
          {step < 4 && (
            <div className={`absolute top-0 flex w-full h-1 bg-gray-100 ${isRTL ? 'right-0' : 'left-0'}`}>
              <div 
                className="h-full bg-brand-600 transition-all duration-500 ease-out" 
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm leading-relaxed">
              {error}
            </div>
          )}

          {message && step !== 4 && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm leading-relaxed">
              {message}
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <form className="space-y-6 animate-fade-in" onSubmit={handleRequestOTP}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {isRTL ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full rounded-md border-gray-300 py-2.5 focus:border-brand-500 focus:ring-brand-500 sm:text-sm border ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRTL ? 'إرسال الرمز' : 'Send OTP')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form className="space-y-6 animate-fade-in" onSubmit={handleVerifyOTP}>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center mb-4">
                  {isRTL ? `أدخل الرمز المرسل إلى ${email}` : `Enter the code sent to ${email}`}
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full rounded-md border-gray-300 py-3 text-center text-3xl tracking-widest font-mono focus:border-brand-500 focus:ring-brand-500 sm:text-2xl border bg-gray-50"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="w-1/3 flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isRTL ? 'تراجع' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-2/3 flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRTL ? 'تحقق من الرمز' : 'Verify OTP')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <form className="space-y-6 animate-fade-in" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`block w-full rounded-md border-gray-300 py-2.5 focus:border-brand-500 focus:ring-brand-500 sm:text-sm border ${isRTL ? 'pr-10 bg-right' : 'pl-10'}`}
                  />
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center cursor-pointer`} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" /> : <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="mt-2 relative rounded-md shadow-sm">
                  <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full rounded-md border-gray-300 py-2.5 focus:border-brand-500 focus:ring-brand-500 sm:text-sm border ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center cursor-pointer`} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" /> : <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />}
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRTL ? 'حفظ وتأكيد' : 'Save & Reset')}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-fade-in py-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">
                {isRTL ? 'تم إعادة تعيين كلمة المرور' : 'Password Reset Successful'}
              </h3>
              <p className="text-sm text-gray-500 px-4">
                {isRTL ? 'يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.' : 'You can now sign in with your new password.'}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                >
                  {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </Link>
              </div>
            </div>
          )}

          {/* Global Back to Sign In Link (only in steps 1-3) */}
          {step < 4 && (
            <div className="mt-8 text-center">
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 text-sm">
                {isRTL ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
