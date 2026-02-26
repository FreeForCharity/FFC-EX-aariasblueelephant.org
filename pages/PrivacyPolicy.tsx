import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [hash]);

    return (
        <div className="bg-white dark:bg-slate-950 py-16 sm:py-24 transition-colors duration-300">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-8">
                    Privacy Policy & Legal Agreements
                </h1>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <p className="text-xl font-medium text-sky-600 dark:text-sky-400">
                        Aaria's Blue Elephant is committed to transparency, inclusion, and the safeguarding of our community. The following documents detail our privacy, terms of use, donation policies, and security commitments.
                    </p>
                    <p className="text-sm text-slate-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

                    {/* Table of Contents for easy navigation inside the page too */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-12">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0 mb-4">Quick Links</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none text-sm">
                            <li><a href="#privacy-policy" className="text-sky-600 dark:text-sky-400 hover:underline">1. Privacy Policy (Including CCPA)</a></li>
                            <li><a href="#cookie-policy" className="text-sky-600 dark:text-sky-400 hover:underline">2. Cookie Policy</a></li>
                            <li><a href="#terms-of-service" className="text-sky-600 dark:text-sky-400 hover:underline">3. Terms of Service</a></li>
                            <li><a href="#donation-policy" className="text-sky-600 dark:text-sky-400 hover:underline">4. Donation Policy</a></li>
                            <li><a href="#vulnerability-disclosure" className="text-sky-600 dark:text-sky-400 hover:underline">5. Vulnerability Disclosure Policy</a></li>
                            <li><a href="#security-acknowledgment" className="text-sky-600 dark:text-sky-400 hover:underline">6. Security Acknowledgement</a></li>
                        </ul>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 1: Privacy Policy & CCPA */}
                    <div id="privacy-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">1. Privacy Policy</h2>
                        <p>
                            Welcome to Aaria's Blue Elephant. We respect your privacy and are committed to protecting your personal information. This policy describes the types of information we may collect from you or that you may provide when you visit aariasblueelephant.org and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Information We Collect</h3>
                        <p>We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, subscribe to the newsletter, fill out an event registration, fill out a volunteer application, and in connection with other activities, services, features or resources we make available. We limit the collection of this data to only what is required to perform our mission.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">How We Use Collected Information</h3>
                        <ul>
                            <li><strong>To improve user experiences:</strong> Using aggregated analytics to understand how our site is used.</li>
                            <li><strong>To coordinate events:</strong> Managing sign-ups and accessibility requests to ensure safe, inclusive playgroups.</li>
                            <li><strong>To process donations:</strong> Facilitating secure and recognized transactions.</li>
                            <li><strong>To send periodic emails:</strong> To send user information and updates pertaining to their involvement.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">California Consumer Privacy Act (CCPA) Privacy Rights</h3>
                        <p>If you are a California resident, you are granted specific rights regarding access to your personal information. Aaria's Blue Elephant complies fully with the CCPA:</p>
                        <ul>
                            <li><strong>Right to Know:</strong> You have the right to request that we disclose certain information to you about our collection and use of your personal information over the past 12 months.</li>
                            <li><strong>Right to Delete:</strong> You have the right to request that we delete any of your personal information that we collected from you and retained, subject to certain exceptions.</li>
                            <li><strong>Right to Opt-Out of Sale:</strong> We do not sell your personal data. We are a nonprofit organization dedicated to our community. However, you maintain the right to direct us not to sell or share your personal information.</li>
                            <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA rights.</li>
                        </ul>
                        <p>To exercise your CCPA rights, please submit a request to us at <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a>. We will verify your request and respond within the timeframe mandated by California law (typically 45 days).</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 2: Cookie Policy */}
                    <div id="cookie-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">2. Cookie Policy</h2>
                        <p>
                            Like many interactive websites, aariasblueelephant.org uses "cookies." A cookie is a small piece of data specifically generated to be saved on a user's computer or mobile device.
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">How We Use Cookies</h3>
                        <ul>
                            <li><strong>Essential Cookies:</strong> We use essential cookies to perform vital functions, such as verifying user identity when logging into our Volunteer and Admin dashboards.</li>
                            <li><strong>Functionality Cookies:</strong> We use these cookies to remember your preferences (like the Dark/Light theme mode) to make your visit smoother.</li>
                            <li><strong>Analytics Cookies:</strong> We may use analytical cookies to observe how users interact with our site, enabling us to continuously improve our inclusive digital experience.</li>
                        </ul>
                        <p>You can choose to set your web browser to refuse cookies, or to alert you when cookies are being sent. If you do so, note that some parts of the site (like the dashboard auth) may not function properly.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 3: Terms of Service */}
                    <div id="terms-of-service" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">3. Terms of Service</h2>
                        <p>
                            By accessing aariasblueelephant.org, you signify your agreement to these terms of service and our commitment to maintaining a respectful, safe, and inclusive environment.
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Use of Services & Community Conduct</h3>
                        <p>Aaria's Blue Elephant relies on compassion and understanding. In using our site to register for events, volunteer, or share stories, you agree not to submit or distribute content that is hateful, abusive, illegal, or contrary to our mission of neurodivergent and neurotypical inclusivity.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Intellectual Property</h3>
                        <p>The content, organization, graphics, design, logos (including Aaria the Elephant), and other matters related to the Site are protected under applicable copyrights and intellectual property laws. The copying, redistribution, or publication of any such matters is strictly prohibited without our express written consent.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Disclaimer of Warranties & Liability limitation</h3>
                        <p>The site and its services are provided on an "as-is" basis. While we strive for perfection and continuous uptime, we cannot guarantee that the site will be error-free or uninterrupted. Aaria's Blue Elephant is not liable for indirect, incidental, or consequential damages arising from the use of our digital platforms.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 4: Donation Policy */}
                    <div id="donation-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">4. Donation Policy</h2>
                        <p>
                            Our guarantee is simple: all events hosted by Aaria's Blue Elephant are 100% free and inclusive for every child. We rely fundamentally on the generosity of the community to make this happen.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Acceptance and Allocation</h3>
                        <p>We accept monetary donations via our secure third-party portals, and occasionally physical in-kind donations of specialized sensory equipment. All donations are used to further the direct mission of the charity, specifically to fund event venues, trained staff, accessibility resources, and operational expenses.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Refunds & Tax Deductibility</h3>
                        <p>As standard practice for non-profit organizations, donations are non-refundable unless there has been a palpable error in the transaction. <strong>Please Note:</strong> Aaria's Blue Elephant is currently operating with its 501(c)(3) tax-exempt status pending. Donors should consult their tax advisors regarding the current deductibility of their contributions.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 5: Vulnerability Disclosure Policy */}
                    <div id="vulnerability-disclosure" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">5. Vulnerability Disclosure Policy</h2>
                        <p>
                            Security is a top priority for protecting our users' data. If you are a security researcher and have discovered a security vulnerability in one of our platforms, we appreciate your help in disclosing it to us responsibly.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Safe Harbor</h3>
                        <p>We will not take legal action against you or ask law enforcement to investigate you if you comply with the following guidelines:</p>
                        <ul>
                            <li>Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service.</li>
                            <li>Do not exploit a security issue you discover for any reason (e.g. no dumping of data, no extortion).</li>
                            <li>Keep the vulnerability confidential until we are able to resolve it.</li>
                        </ul>
                        <p>Please report any findings to <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a></p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 6: Security Acknowledgement */}
                    <div id="security-acknowledgment" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">6. Security Acknowledgement</h2>
                        <p>
                            We wish to extend our deep gratitude to the ethical hackers, developers, and researchers from initiatives like Free For Charity who volunteer their time to identify and responsibly disclose security flaws. Your efforts ensure that charitable platforms like ours remain safe havens for marginalized and targeted groups.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Contact Block */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mt-16">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Legal Entity Information</h4>
                        <ul className="space-y-4 m-0 p-0 list-none text-slate-700 dark:text-slate-300">
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">Organization:</strong> Aaria's Blue Elephant
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">Entity No:</strong> B20250299015
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">Tax Status:</strong> 501(c)(3) (Pending)
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">Email Contact:</strong> <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400 hover:underline">info@aariasblueelephant.org</a>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
