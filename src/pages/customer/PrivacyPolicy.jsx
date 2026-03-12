import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    return (
        <div className={`min-h-[60vh] py-16 px-4 sm:px-6 lg:px-8 bg-white ${isArabic ? 'rtl font-arabic' : 'ltr font-sans'}`}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12 flex flex-col items-center">
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 border border-brand-100 shadow-sm">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                        {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl">
                        {isArabic
                            ? 'نحن نقدر ثقتك بنا. توضح هذه السياسة كيف نقوم بحماية بياناتك الشخصية.'
                            : 'We value your trust. This policy outlines how we protect your personal data.'}
                    </p>
                </div>

                <div className="prose prose-lg prose-gray max-w-none text-gray-600">
                    {isArabic ? (
                        <div className="space-y-10 text-right dir-rtl">
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. المعلومات التي نجمعها</h2>
                                <p>
                                    نحن نجمع المعلومات لتوفير خدمات أفضل لجميع مستخدمينا. تتضمن المعلومات التي نجمعها:
                                </p>
                                <ul className="list-disc pr-6 pl-0 mt-4 space-y-2">
                                    <li><strong>معلومات الحساب والتواصل:</strong> اسمك، بريدك الإلكتروني، ورقم هاتفك المحمول.</li>
                                    <li><strong>بيانات التوصيل:</strong> عنوانك التفصيلي، منطقتك (الضفة الغربية أو الداخل)، وملاحظات الطلب.</li>
                                    <li><strong>بيانات المعاملات:</strong> سجل طلباتك، المبالغ المدفوعة، وحالة الدفع.</li>
                                    <li><strong>معلومات الجلسة (Cookies):</strong> بيانات التصفح الأساسية لتحسين تجربتك وتذكر سلة التسوق الخاصة بك.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. كيف نستخدم معلوماتك</h2>
                                <p>نستخدم المعلومات التي نجمعها من جميع خدماتنا للأغراض التالية:</p>
                                <ul className="list-disc pr-6 pl-0 mt-4 space-y-2">
                                    <li>توفير الخدمات الأساسية وإتمام ومعالجة طلباتك بأمان.</li>
                                    <li>تحديد تكاليف التوصيل بدقة بناءً على عنوانك المختار.</li>
                                    <li>التواصل معك بخصوص حالة الطلبات أو الرد على استفساراتك.</li>
                                    <li>تحسين تجربة التسوق في واجهة المتجر وتخصيص العروض.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. أمان وحماية البيانات</h2>
                                <p>
                                    نعمل بجد لحماية مستخدمينا من الوصول غير المصرح به أو التعديل غير المصرح به
                                    أو الكشف عن أو إتلاف المعلومات التي نحتفظ بها. تتم معالجة جميع المعاملات من
                                    خلال خوادم آمنة ومشفرة. لا نقوم بحفظ أو تخزين أرقام بطاقات الائتمان على خوادمنا بل
                                    نعتمد على بوابات دفع وسيطة موثوقة.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. حقوقك كعميل</h2>
                                <p>
                                    كمستخدم لخدماتنا، يحق لك الوصول إلى معلوماتك الشخصية التي نحتفظ بها وتحديثها.
                                    يمكنك مراجعة جميع تفاصيل حسابك وطلباتك السابقة من خلال صفحة "حسابي".
                                    كما يمكنك طلب حذف بياناتك الشخصية من خلال التواصل مع خدمة العملاء.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. التغييرات على سياسة الخصوصية</h2>
                                <p>
                                    قد تتغير سياسة الخصوصية الخاصة بنا من وقت لآخر. لن نقوم بالتقليل من حقوقك بموجب
                                    سياسة الخصوصية هذه دون موافقتك الصريحة. سنقوم بنشر أي تغييرات على سياسة الخصوصية
                                    في هذه الصفحة.
                                </p>
                            </section>

                            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-12">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">تواصل معنا</h2>
                                <p className="text-gray-600 mb-0">
                                    إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر نموذج "اتصل بنا" أو عبر البريد الإلكتروني الخاص بخدمة العملاء.
                                </p>
                            </section>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                                <p>
                                    We collect information to provide better services to all our users. Information we collect includes:
                                </p>
                                <ul className="list-disc pl-6 pr-0 mt-4 space-y-2">
                                    <li><strong>Account & Contact Info:</strong> Your name, email address, and mobile phone number.</li>
                                    <li><strong>Delivery Data:</strong> Your exact address, delivery region, and courier notes.</li>
                                    <li><strong>Transactional Data:</strong> Your order history, exact amounts paid, and payment status.</li>
                                    <li><strong>Cookies & Session Data:</strong> Basic browsing behavior to maintain your shopping cart and preferences.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Information</h2>
                                <p>We use the information we collect from all of our services for the following purposes:</p>
                                <ul className="list-disc pl-6 pr-0 mt-4 space-y-2">
                                    <li>Providing core services and processing your luxury orders securely.</li>
                                    <li>Accurately calculating delivery costs based on your selected region.</li>
                                    <li>Communicating with you regarding order status, fulfillment, or customer support queries.</li>
                                    <li>Improving the storefront shopping experience and tailoring special offers.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security & Protection</h2>
                                <p>
                                    We work hard to protect our platform and our users from unauthorized access to, or unauthorized
                                    alteration, disclosure, or destruction of information we hold. All transactions are routed through
                                    secure and encrypted servers. We do not store any credit card numbers on our infrastructure directly;
                                    we rely solely on trusted, PCI-compliant payment gateways.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Customer Rights</h2>
                                <p>
                                    As a user of our platform, you have the right to access and update your personal information.
                                    You can review all your account details and historical orders directly from the "My Profile" section.
                                    You also reserve the right to request the deletion of your personal data by contacting customer support.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Changes to This Policy</h2>
                                <p>
                                    Our Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy
                                    without your explicit consent. We will post any privacy policy changes on this page with an updated revision date.
                                </p>
                            </section>

                            <section className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-12">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
                                <p className="text-gray-600 mb-0">
                                    If you have any questions or concerns regarding this Privacy Policy, please reach out via our "Contact Us"
                                    page or by directly emailing our customer support team.
                                </p>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
