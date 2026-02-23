import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-950 py-16 sm:py-24 transition-colors duration-300">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-8">
                    Terms of Service
                </h1>
                <div className="prose prose-lg prose-slate dark:prose-invert">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-slate-900 dark:text-white">1. Agreement to Terms</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Aaria's Blue Elephant ("we," "us" or "our"), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">2. Use of Our Services</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        You agree to use our website and services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website. Prohibited behavior includes harassing or causing distress or inconvenience to any other user, transmitting obscene or offensive content, or disrupting the normal flow of dialogue within our website.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">3. User Registration</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        You may be required to register with the site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">4. Intellectual Property Rights</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">5. Termination</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">6. Modifications and Interruptions</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">7. Governing Law</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        These Terms shall be governed by and defined following the laws of the State of California. Aaria's Blue Elephant and yourself irrevocably consent that the courts of California shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                    </p>

                    <h2 className="text-slate-900 dark:text-white">8. Contact Us</h2>
                    <p className="text-slate-700 dark:text-slate-300">
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: info@aariasblueelephant.org.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
