import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-950 py-16 sm:py-24 transition-colors duration-300">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-8">
                    Privacy Policy
                </h1>
                <div className="prose prose-lg prose-slate dark:prose-invert">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-slate-900 dark:text-white">1. Introduction</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        Welcome to Aaria's Blue Elephant. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at info@aariasblueelephant.org.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">2. Information We Collect</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We collect personal information that you voluntarily provide to us when registering at the website, expressing an interest in obtaining information about us or our products and services, when participating in activities on our website or otherwise contacting us.
                        This may include names, email addresses, phone numbers, and other similar information.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">3. How We Use Your Information</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations. We use the information we collect or receive to facilitate account creation and logon process, to send you marketing and promotional communications, and for other administrative purposes.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">4. Will Your Information Be Shared With Anyone?</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">5. How Long Do We Keep Your Information?</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
                    </p>

                    <h2 className="text-slate-900 dark:text-white">6. How Do We Keep Your Information Safe?</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">7. Your Privacy Rights</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        In some regions (like the European Economic Area), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">8. Contact Us</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        If you have questions or comments about this policy, you may email us at info@aariasblueelephant.org or by post to:
                        <br /><br />
                        Aaria's Blue Elephant<br />
                        101 Felicia Ave<br />
                        Mountain House, CA 95391
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
