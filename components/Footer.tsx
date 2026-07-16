'use client';

import React, { useState } from 'react';
import { MapPin, Mail, Phone, Heart, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import Logo from './Logo';
import SocialLinks from './SocialLinks';
import { tr, isEs } from '../lib/lang';

const CandidSeal: React.FC = () => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    return (
        <a
            ref={ref}
            aria-label="Candid Profile"
            href="https://app.candid.org/profile/16447686/aarias-blue-elephant-39-4799956/?pkId=b8a47feb-927d-4adc-9e4e-794677415e6c"
            target="_blank"
            rel="noopener noreferrer"
            className={`shrink-0 flex flex-col items-center transition-all duration-700 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] ${inView ? 'animate-footer-fade opacity-100' : 'opacity-0'}`}
        >
            <img alt="Candid Platinum Seal" src="https://widgets.guidestar.org/prod/v1/pdp/transparency-seal/16447686/svg" className="h-20 lg:h-24 w-auto mb-1" />
        </a>
    );
};

const Footer: React.FC = () => {
    const [policiesExpanded, setPoliciesExpanded] = useState(false);

    return (
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-sans transition-colors duration-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 items-start">

                    {/* Brand/About Column */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 bg-white dark:bg-white rounded flex items-center justify-center p-1 shadow-sm">
                                <Logo className="h-full w-full" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">Aaria's Blue Elephant</h2>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm text-sm mb-8">
                            {tr(
                                'We envision a world where neurodivergent and neurotypical children grow together. Our mission is to foster inclusive events, promote early intervention, and build a compassionate community through shared experiences.',
                                'Imaginamos un mundo donde los niños neurodivergentes y neurotípicos crecen juntos. Nuestra misión es fomentar eventos inclusivos, promover la intervención temprana y construir una comunidad compasiva a través de experiencias compartidas.'
                            )}
                        </p>
                        <SocialLinks />
                    </div>

                    {/* Links Column */}
                    <div className="lg:pl-12">
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 uppercase tracking-wider relative inline-block">
                            {tr('Useful Links', 'Enlaces útiles')}
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-sky-500"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-3">{tr('Home', 'Inicio')}</Link></li>
                            <li><Link to="/about" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-3">{tr('About Us', 'Sobre nosotros')}</Link></li>
                            <li><Link to="/events" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-3">{tr('Events', 'Eventos')}</Link></li>
                            <li><Link to="/volunteer" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-3">{tr('Get Involved', 'Participa')}</Link></li>
                            <li><a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex items-center gap-3">{tr('Donate', 'Dona')}</a></li>
                            <li className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
                                <button
                                    onClick={() => setPoliciesExpanded(!policiesExpanded)}
                                    className="w-full text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex justify-between items-center"
                                >
                                    <span>{tr('Policies & Legal', 'Políticas y legal')}</span>
                                    {policiesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${policiesExpanded ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <ul className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                                        <li><Link to="/privacy-policy#privacy-policy" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('Privacy Policy', 'Política de privacidad')}</Link></li>
                                        <li><Link to="/privacy-policy#cookie-policy" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('Cookie Policy', 'Política de cookies')}</Link></li>
                                        <li><Link to="/privacy-policy#terms-of-service" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('Terms of Service', 'Términos de servicio')}</Link></li>
                                        <li><Link to="/privacy-policy#donation-policy" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('Donation Policy', 'Política de donaciones')}</Link></li>
                                        <li><Link to="/privacy-policy#vulnerability-disclosure" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('Vulnerability Disclosure', 'Divulgación de vulnerabilidades')}</Link></li>
                                        <li><a href="/legal/disclosure.html" target="_blank" rel="noopener" className="text-sm text-slate-500 hover:text-sky-600 transition-colors block">{tr('General Disclosure', 'Aviso general')}</a></li>
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 uppercase tracking-wider relative inline-block">
                            {tr('Contact Us', 'Contáctanos')}
                            <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-sky-500"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4 text-slate-500 dark:text-slate-400 group">
                                <MapPin className="h-6 w-6 text-sky-600 dark:text-sky-500 shrink-0 group-hover:scale-110 transition-transform mt-1" />
                                <a href="https://maps.google.com/?q=Tracy+Mountain+House,+CA+95391" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    Tracy/Mountain House, CA 95391
                                </a>
                            </li>
                            <li className="flex items-center gap-4 text-slate-500 dark:text-slate-400 group">
                                <Mail className="h-5 w-5 text-sky-600 dark:text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="mailto:info@aariasblueelephant.org" className="text-sm hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    info@aariasblueelephant.org
                                </a>
                            </li>
                            <li className="flex items-center gap-4 text-slate-500 dark:text-slate-400 group">
                                <Phone className="h-5 w-5 text-sky-600 dark:text-sky-500 shrink-0 group-hover:scale-110 transition-transform" />
                                <a href="tel:+14242548402" className="text-sm hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                                    424-254-8402
                                </a>
                            </li>
                            <li className="pt-10 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-12 justify-between">
                                    <div className="space-y-1">
                                        <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mb-3">{tr('Legal Identity', 'Identidad legal')}</span>
                                        <span className="text-slate-700 dark:text-slate-200 font-semibold text-sm block">{tr('501(c)(3) Nonprofit Organization', 'Organización sin fines de lucro 501(c)(3)')}</span>
                                        <span className="block text-xs text-sky-700 dark:text-sky-500/70 font-mono italic">EIN: 39-4799956</span>
                                        <span className="block text-xs text-sky-700 dark:text-sky-500/70 font-mono italic">Entity No: B20250299015</span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <CandidSeal />
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-white dark:bg-slate-950 py-6 border-t border-slate-200 dark:border-slate-900 transition-colors duration-500">
                {isEs() && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-4">
                        <p lang="es" className="text-slate-500 dark:text-slate-400 text-xs text-center md:text-left leading-relaxed">
                            🌐 La traducción al español de este sitio fue hecha completamente con inteligencia artificial y puede tener errores — el texto en inglés es la versión oficial. Si encuentras algo raro, por favor avísanos y lo corregiremos con gusto.{' '}
                            <a href="/legal/disclosure.html" target="_blank" rel="noopener" className="underline hover:text-sky-600">Ver aviso completo</a>
                        </p>
                    </div>
                )}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center md:text-left">
                        Copyright &copy; <span id="year">{new Date().getFullYear()}</span> Aaria's Blue Elephant. {tr('All Rights Reserved.', 'Todos los derechos reservados.')}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 gap-2 text-sm mt-4 md:mt-0 flex items-center justify-center md:justify-end">
                        <span>{tr('Designed with', 'Diseñado con')}</span>
                        <Heart className="h-4 w-4 text-sky-600 dark:text-sky-500 animate-pulse" />
                        <span>{tr('in California', 'en California')}</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
