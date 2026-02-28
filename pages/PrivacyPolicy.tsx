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
                    Privacy Policy &amp; Legal Agreements
                </h1>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <p className="text-xl font-medium text-sky-600 dark:text-sky-400">
                        Aaria's Blue Elephant is committed to transparency, inclusion, and the safeguarding of our community. The following documents detail our privacy, terms of use, donation policies, and security commitments.
                    </p>
                    <p className="text-sm text-slate-500 mb-12">Last updated: February 28, 2025</p>

                    {/* Table of Contents */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-12">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0 mb-4">Quick Links</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none text-sm">
                            <li><a href="#privacy-policy" className="text-sky-600 dark:text-sky-400 hover:underline">1. Privacy Policy (Including CCPA)</a></li>
                            <li><a href="#data-collection" className="text-sky-600 dark:text-sky-400 hover:underline">2. Data Collection &amp; Authentication</a></li>
                            <li><a href="#age-restrictions" className="text-sky-600 dark:text-sky-400 hover:underline">3. Age Restrictions &amp; COPPA</a></li>
                            <li><a href="#user-content" className="text-sky-600 dark:text-sky-400 hover:underline">4. User-Generated Content</a></li>
                            <li><a href="#cookie-policy" className="text-sky-600 dark:text-sky-400 hover:underline">5. Cookie Policy</a></li>
                            <li><a href="#cybersecurity" className="text-sky-600 dark:text-sky-400 hover:underline">6. Cybersecurity &amp; Data Protection</a></li>
                            <li><a href="#terms-of-service" className="text-sky-600 dark:text-sky-400 hover:underline">7. Terms of Service</a></li>
                            <li><a href="#donation-policy" className="text-sky-600 dark:text-sky-400 hover:underline">8. Donation Policy</a></li>
                            <li><a href="#vulnerability-disclosure" className="text-sky-600 dark:text-sky-400 hover:underline">9. Vulnerability Disclosure Policy</a></li>
                            <li><a href="#security-acknowledgment" className="text-sky-600 dark:text-sky-400 hover:underline">10. Security Acknowledgement</a></li>
                        </ul>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 1: Privacy Policy & CCPA */}
                    <div id="privacy-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">1. Privacy Policy</h2>
                        <p>
                            Welcome to Aaria's Blue Elephant. We respect your privacy and are committed to protecting your personal information. This policy describes the types of information we may collect from you or that you may provide when you visit aariasblueelephant.org, use our volunteer dashboard, or otherwise interact with our services — and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">How We Use Collected Information</h3>
                        <ul>
                            <li><strong>To improve user experiences:</strong> Using aggregated analytics to understand how our site is used.</li>
                            <li><strong>To coordinate events:</strong> Managing sign-ups and accessibility requests to ensure safe, inclusive playgroups.</li>
                            <li><strong>To process donations:</strong> Facilitating secure and recognized transactions through our third-party donation platform (Zeffy).</li>
                            <li><strong>To authenticate users:</strong> Verifying the identity of board members, volunteers, and administrators who access our internal dashboard.</li>
                            <li><strong>To send periodic emails:</strong> Sending users information and updates pertaining to their involvement, when they have consented to receive such communications.</li>
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

                    {/* Section 2: Data Collection & Authentication — NEW */}
                    <div id="data-collection" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">2. Data Collection &amp; Authentication</h2>
                        <p>
                            Our primary website hosted at <strong>aariasblueelephant.org</strong> is a <strong>static website</strong> hosted on GitHub Pages. In its static form, we do not independently collect or store personal information beyond standard browser cookies and your browser's local storage (used for theme preferences).
                        </p>
                        <p>
                            However, our website also provides an authenticated <strong>Volunteer and Admin Dashboard</strong>, which operates as an application and collects additional user data. This dashboard is powered by <strong>Supabase</strong> (a third-party backend-as-a-service platform) and uses <strong>Google OAuth 2.0</strong> for authentication.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Information Collected During Authentication</h3>
                        <p>When you create an account or log in via Google OAuth, we collect and store the following information via Supabase:</p>
                        <ul>
                            <li><strong>Full name</strong> as provided by your Google account</li>
                            <li><strong>Email address</strong> associated with your Google account</li>
                            <li><strong>Profile photo URL</strong> from your Google account (if available)</li>
                            <li><strong>Authentication tokens</strong> and session identifiers used to maintain your logged-in state</li>
                            <li><strong>Account role</strong> (e.g., Volunteer, Donor, Board Member) assigned by our administrators</li>
                            <li><strong>Timestamps</strong> of account creation and last login</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Third-Party Processors</h3>
                        <ul>
                            <li><strong>Supabase (supabase.io):</strong> Acts as our database and authentication backend. All authentication data is stored in Supabase-managed infrastructure. Supabase is SOC 2 Type II compliant. Please review <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400">Supabase's Privacy Policy</a>.</li>
                            <li><strong>Google OAuth 2.0:</strong> Used for secure, passwordless sign-in. We only receive the data that Google provides upon your explicit authorization. Please review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400">Google's Privacy Policy</a>.</li>
                            <li><strong>Zeffy:</strong> Our third-party donation processing platform handles all payment card data. We do not store financial information on our servers.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Data Retention</h3>
                        <p>
                            Account data is retained for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a>. We will process all deletion requests within 30 days.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 3: Age Restrictions & COPPA — NEW */}
                    <div id="age-restrictions" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">3. Age Restrictions &amp; Child Protection (COPPA)</h2>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl my-6">
                            <p className="font-bold text-amber-800 dark:text-amber-300 m-0">
                                ⚠️ Important Notice: Aaria's Blue Elephant does not authorize accounts for individuals under the age of 13.
                            </p>
                        </div>

                        <p>
                            In compliance with the <strong>Children's Online Privacy Protection Act (COPPA)</strong> and applicable state child protection laws, our authenticated application is strictly for use by adults (individuals who are 13 years of age or older).
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Account Eligibility</h3>
                        <ul>
                            <li>You must be at least <strong>13 years of age</strong> to create an account or access our volunteer/admin dashboard.</li>
                            <li>By creating an account, you represent and warrant that you are 13 years of age or older.</li>
                            <li>Accounts are intended for adult volunteers, donors, and board members — not the children who participate in our playgroups.</li>
                            <li>If we become aware that a user is under 13, we will immediately disable that account and delete all associated data.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Children's Participation</h3>
                        <p>
                            While our mission is to serve neurodivergent and neurotypical children at community playgroups, all <strong>data collection through our digital platform is the responsibility of the attending adult</strong> (parent or legal guardian). We do not collect personal data directly from children. Parents who share any information about their children in testimonials or event registrations do so on behalf of their child as legal guardians.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Parental Consent</h3>
                        <p>
                            If you believe that a child under 13 has provided us with personal information without parental consent, please contact us immediately at <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a> so that we can promptly investigate and take appropriate action, including account deletion.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 4: User-Generated Content — NEW */}
                    <div id="user-content" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">4. User-Generated Content</h2>
                        <p>
                            Our platform allows authorized users (board members and administrators) to submit testimonials, event posts, and community stories that may be displayed publicly on our website. The following terms govern all user-generated content (UGC).
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Prohibited Content</h3>
                        <p>By submitting any content to Aaria's Blue Elephant's platform, you agree that you will not post content that:</p>
                        <ul>
                            <li>Violates any applicable local, state, national, or international law or regulation</li>
                            <li>Infringes upon the intellectual property, privacy, or publicity rights of any person</li>
                            <li>Contains personal identifying information about a child without explicit parental consent</li>
                            <li>Is hateful, abusive, discriminatory, defamatory, obscene, or threatening</li>
                            <li>Constitutes unauthorized advertising, spam, or solicitation</li>
                            <li>Violates the privacy of any individual or discloses confidential information</li>
                            <li>Is contrary to our mission of inclusive, compassionate community building</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Content Responsibility &amp; Liability</h3>
                        <p>
                            <strong>You are solely responsible for the content you submit.</strong> Aaria's Blue Elephant does not pre-screen all user-generated content, but we reserve the right to review, edit, or remove any content that violates these terms or that we determine, in our sole discretion, is harmful to our community or mission.
                        </p>
                        <p>
                            By submitting content, you grant Aaria's Blue Elephant a non-exclusive, royalty-free, perpetual license to use, display, and distribute that content in connection with our mission and services. You represent that you hold all necessary rights to grant this license.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Testimonials and Children's Images</h3>
                        <p>
                            If you submit a testimonial that includes reference to or images of children, you affirm that you are the parent or legal guardian of all minors mentioned or depicted, and that you consent to that content being displayed on our public website. We will honor any subsequent requests to remove such content.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 5: Cookie Policy */}
                    <div id="cookie-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">5. Cookie Policy</h2>
                        <p>
                            Like many interactive websites, aariasblueelephant.org uses "cookies" and browser local storage. A cookie is a small piece of data specifically generated to be saved on a user's computer or mobile device.
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">How We Use Cookies</h3>
                        <ul>
                            <li><strong>Essential Cookies:</strong> We use essential cookies to perform vital functions, such as verifying user identity when logging into our Volunteer and Admin dashboards via Supabase authentication sessions.</li>
                            <li><strong>Functionality Cookies / Local Storage:</strong> We use browser local storage to remember your preferences (like the Dark/Light theme mode) to make your visit smoother. This data is stored only on your device and not transmitted to our servers.</li>
                            <li><strong>Analytics Cookies:</strong> We may use analytical cookies to observe how users interact with our site, enabling us to continuously improve our inclusive digital experience. We do not use tracking cookies for advertising purposes.</li>
                        </ul>
                        <p>You can choose to set your web browser to refuse cookies, or to alert you when cookies are being sent. If you do so, note that some parts of the site (like the dashboard auth) may not function properly.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 6: Cybersecurity & Data Protection — NEW/EXPANDED */}
                    <div id="cybersecurity" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">6. Cybersecurity &amp; Data Protection</h2>
                        <p>
                            Because we operate an application that collects user login information and may store community data, we take our cybersecurity responsibilities seriously. We have implemented the following safeguards to protect authorized users' data:
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Technical Safeguards</h3>
                        <ul>
                            <li><strong>Encrypted Authentication:</strong> All user authentication is handled via Google OAuth 2.0 and Supabase. We never store raw passwords. Authentication tokens are encrypted in transit using industry-standard TLS/HTTPS protocols.</li>
                            <li><strong>Row-Level Security (RLS):</strong> Our Supabase database enforces row-level security policies so that users can only access data they are explicitly authorized to view.</li>
                            <li><strong>HTTPS Everywhere:</strong> Our entire website is served over HTTPS, preventing man-in-the-middle interception of data.</li>
                            <li><strong>Minimal Data Collection:</strong> We only collect the data necessary to operate our service. We do not collect financial data, government IDs, or other highly sensitive personal information.</li>
                            <li><strong>Third-Party Security:</strong> We rely on Supabase (SOC 2 Type II compliant) and Google (ISO 27001, SOC 2/3 certified) as our authentication and data infrastructure providers, benefiting from enterprise-grade security.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Our Cybersecurity Obligations</h3>
                        <p>
                            By operating an application that collects login information, we acknowledge our responsibility to:
                        </p>
                        <ul>
                            <li>Maintain the confidentiality and integrity of all user data we collect</li>
                            <li>Promptly investigate and respond to any suspected security incidents or data breaches</li>
                            <li>Notify affected users and relevant authorities in the event of a confirmed data breach, as required by California law (Cal. Civ. Code § 1798.29) and applicable regulations</li>
                            <li>Regularly review and update our security practices as technology and threats evolve</li>
                            <li>Limit access to user data to only staff or volunteers who require it to perform their organizational role</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Data Breach Notification</h3>
                        <p>
                            In the event of a data security breach that is likely to result in harm to our users, we will notify affected individuals by email within <strong>72 hours</strong> of becoming aware of the breach, to the extent practicable. Notification will include the nature of the breach, the data affected, and the steps we are taking to address it.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Limitations</h3>
                        <p>
                            While we employ robust safeguards, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of data transmitted to or from our site. Users share information at their own risk, and we recommend using strong, unique passwords for your Google account and enabling two-factor authentication.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 7: Terms of Service */}
                    <div id="terms-of-service" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">7. Terms of Service</h2>
                        <p>
                            By accessing aariasblueelephant.org, you signify your agreement to these terms of service and our commitment to maintaining a respectful, safe, and inclusive environment.
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Use of Services &amp; Community Conduct</h3>
                        <p>Aaria's Blue Elephant relies on compassion and understanding. In using our site to register for events, volunteer, or share stories, you agree not to submit or distribute content that is hateful, abusive, illegal, or contrary to our mission of neurodivergent and neurotypical inclusivity.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Account Eligibility</h3>
                        <p>
                            You must be at least 13 years of age to use our authenticated services. By creating an account, you represent that you meet this age requirement. We reserve the right to immediately terminate any account that we determine is held by a person under the age of 13.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Intellectual Property</h3>
                        <p>The content, organization, graphics, design, logos (including Aaria the Elephant), and other matters related to the Site are protected under applicable copyrights and intellectual property laws. The copying, redistribution, or publication of any such matters is strictly prohibited without our express written consent.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Disclaimer of Warranties &amp; Liability Limitation</h3>
                        <p>The site and its services are provided on an "as-is" basis. While we strive for perfection and continuous uptime, we cannot guarantee that the site will be error-free or uninterrupted. Aaria's Blue Elephant is not liable for indirect, incidental, or consequential damages arising from the use of our digital platforms.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 8: Donation Policy */}
                    <div id="donation-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">8. Donation Policy</h2>
                        <p>
                            Our guarantee is simple: all events hosted by Aaria's Blue Elephant are 100% free and inclusive for every child. We rely fundamentally on the generosity of the community to make this happen.
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Acceptance and Allocation</h3>
                        <p>We accept monetary donations via our secure third-party portals, and occasionally physical in-kind donations of specialized sensory equipment. All donations are used to further the direct mission of the charity, specifically to fund event venues, trained staff, accessibility resources, and operational expenses.</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">Refunds &amp; Tax Deductibility</h3>
                        <p>As standard practice for non-profit organizations, donations are non-refundable unless there has been a palpable error in the transaction. <strong>Please Note:</strong> Aaria's Blue Elephant is currently operating with its 501(c)(3) tax-exempt status pending. Donors should consult their tax advisors regarding the current deductibility of their contributions.</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 9: Vulnerability Disclosure Policy */}
                    <div id="vulnerability-disclosure" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">9. Vulnerability Disclosure Policy</h2>
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

                    {/* Section 10: Security Acknowledgement */}
                    <div id="security-acknowledgment" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">10. Security Acknowledgement</h2>
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
                                <strong className="text-slate-900 dark:text-white w-32">Address:</strong> 101 Felicia Ave, Tracy, CA 95391
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">Tax Status:</strong> 501(c)(3) Pending
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
