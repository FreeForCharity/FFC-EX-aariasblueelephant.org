'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PrivacyContent() {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } else {
            window.scrollTo(0, 0);
        }
    }, [searchParams]);

    return (
        <div className="bg-white dark:bg-slate-950 py-16 sm:py-24 transition-colors duration-300 pt-32">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-8 uppercase italic tracking-tighter">
                    Privacy Policy &amp; Legal Agreements
                </h1>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                        Aaria's Blue Elephant is committed to transparency, inclusion, and the safeguarding of our community. The following documents detail our privacy, terms of use, donation policies, and security commitments.
                    </p>
                    <p className="text-sm text-slate-500 mb-12 font-bold">Last updated: February 28, 2025</p>

                    {/* Table of Contents */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-12 shadow-sm">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0 mb-4 uppercase italic">Quick Links</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none text-sm font-bold">
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
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter underline decoration-sky-500 decoration-4">1. Privacy Policy</h2>
                        <p className="font-medium">
                            Welcome to Aaria's Blue Elephant. We respect your privacy and are committed to protecting your personal information. This policy describes the types of information we may collect from you or that you may provide when you visit aariasblueelephant.org, use our volunteer dashboard, or otherwise interact with our services — and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                        </p>

                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mt-8 mb-4 uppercase italic">How We Use Collected Information</h3>
                        <ul className="space-y-2 font-medium">
                            <li><strong>To improve user experiences:</strong> Using aggregated analytics to understand how our site is used.</li>
                            <li><strong>To coordinate events:</strong> Managing sign-ups and accessibility requests to ensure safe, inclusive events.</li>
                            <li><strong>To process donations:</strong> Facilitating secure and recognized transactions through our third-party donation platform (Zeffy).</li>
                            <li><strong>To authenticate users:</strong> Verifying the identity of board members, volunteers, and administrators who access our internal dashboard.</li>
                            <li><strong>To send periodic emails:</strong> Sending users information and updates pertaining to their involvement, when they have consented to receive such communications.</li>
                        </ul>

                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mt-8 mb-4 uppercase italic">California Consumer Privacy Act (CCPA) Privacy Rights</h3>
                        <p className="font-medium">If you are a California resident, you are granted specific rights regarding access to your personal information. Aaria's Blue Elephant complies fully with the CCPA:</p>
                        <ul className="space-y-2 font-medium">
                            <li><strong>Right to Know:</strong> You have the right to request that we disclose certain information to you about our collection and use of your personal information over the past 12 months.</li>
                            <li><strong>Right to Delete:</strong> You have the right to request that we delete any of your personal information that we collected from you and retained, subject to certain exceptions.</li>
                            <li><strong>Right to Opt-Out of Sale:</strong> We do not sell your personal data. We are a nonprofit organization dedicated to our community. However, you maintain the right to direct us not to sell or share your personal information.</li>
                            <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA rights.</li>
                        </ul>
                        <p className="font-medium">To exercise your CCPA rights, please submit a request to us at <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400 font-bold underline">info@aariasblueelephant.org</a>. We will verify your request and respond within the timeframe mandated by California law (typically 45 days).</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 2: Data Collection & Authentication */}
                    <div id="data-collection" className="scroll-mt-32">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter underline decoration-brand-purple decoration-4">2. Data Collection &amp; Authentication</h2>
                        <p className="font-medium">
                            Our primary website hosted at <strong>aariasblueelephant.org</strong> is built with modern technologies of Next.js and React. In its general form, we do not independently collect or store personal information beyond standard browser cookies and your browser's local storage (used for theme preferences).
                        </p>
                        <p className="font-medium">
                            However, our website also provides an authenticated <strong>Volunteer and Admin Dashboard</strong>, which operates as an application and collects additional user data. This dashboard is powered by <strong>Supabase</strong> (a third-party backend-as-a-service platform) and uses <strong>Google OAuth 2.0</strong> for authentication.
                        </p>

                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mt-8 mb-4 uppercase italic">Information Collected During Authentication</h3>
                        <p className="font-medium">When you create an account or log in via Google OAuth, we collect and store the following information via Supabase:</p>
                        <ul className="space-y-2 font-medium">
                            <li><strong>Full name</strong> as provided by your Google account</li>
                            <li><strong>Email address</strong> associated with your Google account</li>
                            <li><strong>Profile photo URL</strong> from your Google account (if available)</li>
                            <li><strong>Authentication tokens</strong> and session identifiers used to maintain your logged-in state</li>
                            <li><strong>Account role</strong> (e.g., Volunteer, Donor, Board Member) assigned by our administrators</li>
                            <li><strong>Timestamps</strong> of account creation and last login</li>
                        </ul>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    <div id="age-restrictions" className="scroll-mt-32">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter underline decoration-brand-pink decoration-4">3. Age Restrictions &amp; Child Protection (COPPA)</h2>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-8 border-amber-500 p-6 rounded-r-[2rem] my-8 shadow-sm">
                            <p className="font-black text-amber-900 dark:text-amber-100 m-0 uppercase italic tracking-tighter text-lg">
                                ⚠️ Important Notice: Aaria's Blue Elephant does not authorize accounts for individuals under the age of 13.
                            </p>
                        </div>
                        <p className="font-medium">
                            In compliance with the <strong>Children's Online Privacy Protection Act (COPPA)</strong> and applicable state child protection laws, our authenticated application is strictly for use by adults (individuals who are 13 years of age or older).
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    <div id="cybersecurity" className="scroll-mt-32">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter underline decoration-emerald-500 decoration-4">6. Cybersecurity &amp; Data Protection</h2>
                        <p className="font-medium">
                            Because we operate an application that collects user login information and may store community data, we take our cybersecurity responsibilities seriously.
                        </p>
                        <ul className="space-y-4 font-medium mb-12">
                            <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <strong>Encrypted Authentication:</strong> All user authentication is handled via Google OAuth 2.0 and Supabase. We never store raw passwords.
                            </li>
                            <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <strong>Row-Level Security (RLS):</strong> Our database enforces policies so that users can only access data they are explicitly authorized to view.
                            </li>
                            <li className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <strong>HTTPS Everywhere:</strong> Our entire website is served over HTTPS, preventing man-in-the-middle interception of data.
                            </li>
                        </ul>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    <div id="donation-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase italic tracking-tighter underline decoration-sky-500 decoration-4">8. Donation Policy</h2>
                        <p className="text-xl font-bold bg-sky-50 dark:bg-sky-900/20 p-6 rounded-3xl border border-sky-100 dark:border-sky-800 mb-8">
                            Our guarantee is simple: all events hosted by Aaria's Blue Elephant are 100% free and inclusive for every child. We rely fundamentally on the generosity of the community to make this happen.
                        </p>
                        <p className="font-medium">
                            As standard practice for non-profit organizations, donations are non-refundable. <strong>Please Note:</strong> Aaria's Blue Elephant is currently operating with its 501(c)(3) tax-exempt status pending. Donors should consult their tax advisors regarding the current deductibility of their contributions.
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Contact Block */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] border border-slate-700 mt-16 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <svg className="w-32 h-32 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        <h4 className="text-2xl font-black text-white mb-8 uppercase italic italic tracking-tighter">Legal Entity Information</h4>
                        <ul className="space-y-4 m-0 p-0 list-none text-slate-300 font-bold">
                            <li className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sky-400 w-32 uppercase text-xs tracking-widest">Organization</span> 
                                <span className="text-white text-lg">Aaria's Blue Elephant</span>
                            </li>
                            <li className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sky-400 w-32 uppercase text-xs tracking-widest">Entity No</span> 
                                <span className="text-white text-lg">B20250299015</span>
                            </li>
                            <li className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sky-400 w-32 uppercase text-xs tracking-widest">Tax Status</span> 
                                <span className="text-white text-lg underline decoration-brand-purple underline-offset-4 decoration-2">501(c)(3) Pending</span>
                            </li>
                            <li className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sky-400 w-32 uppercase text-xs tracking-widest">Contact</span> 
                                <a href="mailto:info@aariasblueelephant.org" className="text-white text-lg hover:text-sky-400 transition-colors">info@aariasblueelephant.org</a>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center pt-32">Loading...</div>}>
            <PrivacyContent />
        </Suspense>
    );
}
