const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const { Resend } = require('resend');

admin.initializeApp();
const db = admin.firestore();

// Define the secret parameter bound to Google Cloud Secret Manager
const resendApiKey = defineSecret('RESEND_API_KEY');

// Helper to get Resend instance
const getResendClient = (rawKey) => {
  let apiKey = rawKey || '';
  apiKey = apiKey.replace(/['"]/g, '').trim(); // aggressively strip quotes
  
  console.log("Checking API Key existence:", !!apiKey);
  if (apiKey) {
    console.log("API Key starts with re_:", apiKey.startsWith("re_"));
  }

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable.");
    throw new HttpsError('failed-precondition', 'Email provider (Resend) is not configured. Please contact the administrator.');
  }
  return new Resend(apiKey);
};

/**
 * Callable Function: requestPasswordReset
 * Checks if user exists, generates OTP, saves in Firestore, and emails it.
 */
exports.requestPasswordReset = onCall(
  { secrets: [resendApiKey] },
  async (request) => {
  const { email, lang = 'en' } = request.data;
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required.');
  }

  try {
    console.log(`[requestPasswordReset] Checking if user ${email} exists...`);
    // 1. Verify user exists
    const user = await admin.auth().getUserByEmail(email);
    console.log(`[requestPasswordReset] User found: ${user.uid}`);
    
    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[requestPasswordReset] OTP generated successfully.`);
    
    // 3. Store in Firestore with 10-minute validity
    console.log(`[requestPasswordReset] Saving OTP to Firestore...`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
    await db.collection('passwordResets').doc(email).set({
      email,
      otp,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      attempts: 0
    });
    console.log(`[requestPasswordReset] OTP saved to Firestore.`);

    // 4. Send Email
    console.log(`[requestPasswordReset] Initializing Resend client...`);
    const resend = getResendClient(resendApiKey.value()); // Throws if config is missing
    
    console.log(`[requestPasswordReset] Sending email...`);
    const subject = 'رمز استعادة كلمة المرور - Victor Shop';
    
    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea;" dir="rtl">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eaeaea;">
          <h2 style="color: #111827; margin: 0;">Victor Shop</h2>
        </div>
        <div style="padding: 30px 0; text-align: center;">
          <h1 style="color: #374151; font-size: 24px; margin-bottom: 10px;">رمز إعادة تعيين كلمة المرور</h1>
          <p style="color: #6b7280; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
            مرحباً ${user.displayName || 'بكم'}، يرجى استخدام الرمز التالي لإعادة تعيين كلمة المرور الخاصة بك.<br/>
            <strong>هذا الرمز صالح لمدة 10 دقائق فقط.</strong>
          </p>
          <div style="background-color: #f3f4f6; padding: 20px 40px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
          </div>
        </div>
        <div style="padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة ولا تشارك الرمز مع أي شخص.
          </p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Victor Shop Security <onboarding@resend.dev>',
      to: email,
      subject,
      html: htmlEmail
    });

    if (error) {
       console.error(`[requestPasswordReset] Resend delivery error:`, error);
       throw new HttpsError('internal', `Email delivery failed: ${error.message}`);
    }
    
    console.log(`[requestPasswordReset] Email successfully sent! messageId: ${data?.id}`);

    return { success: true };
  } catch (error) {
    console.error('[requestPasswordReset] CRITICAL ERROR:', error);
    
    // Bubble up HttpsError (like our config check) so the frontend gets the precise message
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error.code === 'auth/user-not-found') {
       throw new HttpsError('not-found', 'Email not found. Please check your spelling.');
    }
    
    throw new HttpsError('internal', `An error occurred: ${error.message}`);
  }
});

/**
 * Callable Function: verifyOTPOnly
 * Validates OTP without resetting the password (for UI flow).
 */
exports.verifyOTPOnly = onCall(async (request) => {
  const { email, otp } = request.data;
  if (!email || !otp) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const docRef = db.collection('passwordResets').doc(email);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'No active password reset request.');
  }

  const resetData = doc.data();

  if (resetData.attempts >= 5) {
    await docRef.delete();
    throw new HttpsError('resource-exhausted', 'Too many failed attempts.');
  }

  if (resetData.expiresAt.toDate() < new Date()) {
    await docRef.delete();
    throw new HttpsError('failed-precondition', 'OTP has expired.');
  }

  if (resetData.otp !== otp) {
    await docRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError('invalid-argument', 'Incorrect OTP.');
  }

  return { success: true };
});

/**
 * Callable Function: verifyAndResetPassword
 * Validates OTP and updates password using Admin SDK.
 */
exports.verifyAndResetPassword = onCall(async (request) => {
  const { email, otp, newPassword } = request.data;
  if (!email || !otp || !newPassword) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  const docRef = db.collection('passwordResets').doc(email);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'No active password reset request.');
  }

  const resetData = doc.data();

  // 1. Check attempts
  if (resetData.attempts >= 5) {
    await docRef.delete();
    throw new HttpsError('resource-exhausted', 'Too many failed attempts. Please request a new code.');
  }

  // 2. Check expiration
  if (resetData.expiresAt.toDate() < new Date()) {
    await docRef.delete();
    throw new HttpsError('failed-precondition', 'OTP has expired.');
  }

  // 3. Validate OTP
  if (resetData.otp !== otp) {
    await docRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError('invalid-argument', 'Incorrect OTP.');
  }

  // 4. Success: Update Password
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    
    // Clean up used OTP
    await docRef.delete();

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    throw new HttpsError('internal', 'Unable to update password. It may be too weak.');
  }
});
