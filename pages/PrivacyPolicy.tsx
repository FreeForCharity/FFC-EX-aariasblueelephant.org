import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tr } from '../lib/lang';

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
                    {tr('Privacy Policy & Legal Agreements', 'Política de Privacidad y Acuerdos Legales')}
                </h1>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <p className="text-xl font-medium text-sky-600 dark:text-sky-400">
                        {tr("Aaria's Blue Elephant is committed to transparency, inclusion, and the safeguarding of our community. The following documents detail our privacy, terms of use, donation policies, and security commitments.", "Aaria's Blue Elephant se compromete con la transparencia, la inclusión y la protección de nuestra comunidad. Los siguientes documentos detallan nuestra política de privacidad, condiciones de uso, políticas de donación y compromisos de seguridad.")}
                    </p>
                    <p className="text-sm text-slate-500 mb-12">{tr('Last updated: July 10, 2026', 'Última actualización: 10 de julio de 2026')}</p>

                    {/* Table of Contents */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-12">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0 mb-4">{tr('Quick Links', 'Enlaces Rápidos')}</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 m-0 p-0 list-none text-sm">
                            <li><a href="#privacy-policy" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('1. Privacy Policy (Including CCPA)', '1. Política de Privacidad (Incluyendo CCPA)')}</a></li>
                            <li><a href="#data-collection" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('2. Data Collection & Authentication', '2. Recopilación de Datos y Autenticación')}</a></li>
                            <li><a href="#age-restrictions" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('3. Age Restrictions & COPPA', '3. Restricciones de Edad y COPPA')}</a></li>
                            <li><a href="#user-content" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('4. User-Generated Content', '4. Contenido Generado por Usuarios')}</a></li>
                            <li><a href="#cookie-policy" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('5. Cookie Policy', '5. Política de Cookies')}</a></li>
                            <li><a href="#cybersecurity" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('6. Cybersecurity & Data Protection', '6. Ciberseguridad y Protección de Datos')}</a></li>
                            <li><a href="#terms-of-service" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('7. Terms of Service', '7. Términos de Servicio')}</a></li>
                            <li><a href="#donation-policy" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('8. Donation Policy', '8. Política de Donaciones')}</a></li>
                            <li><a href="#vulnerability-disclosure" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('9. Vulnerability Disclosure Policy', '9. Política de Divulgación de Vulnerabilidades')}</a></li>
                            <li><a href="#security-acknowledgment" className="text-sky-600 dark:text-sky-400 hover:underline">{tr('10. Security Acknowledgement', '10. Reconocimiento de Seguridad')}</a></li>
                        </ul>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 1: Privacy Policy & CCPA */}
                    <div id="privacy-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('1. Privacy Policy', '1. Política de Privacidad')}</h2>
                        <p>
                            {tr("Welcome to Aaria's Blue Elephant. We respect your privacy and are committed to protecting your personal information. This policy describes the types of information we may collect from you or that you may provide when you visit aariasblueelephant.org, use our volunteer dashboard, or otherwise interact with our services — and our practices for collecting, using, maintaining, protecting, and disclosing that information.", "Bienvenido a Aaria's Blue Elephant. Respetamos tu privacidad y nos comprometemos a proteger tu información personal. Esta política describe los tipos de información que podemos recopilar de ti o que puedas proporcionar cuando visitas aariasblueelephant.org, usas nuestro panel de voluntarios, o interactúas de otra manera con nuestros servicios — y nuestras prácticas para recopilar, usar, mantener, proteger y divulgar esa información.")}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('How We Use Collected Information', 'Cómo Usamos la Información Recopilada')}</h3>
                        <ul>
                            <li><strong>{tr('To improve user experiences:', 'Para mejorar la experiencia de los usuarios:')}</strong> {tr('Using aggregated analytics to understand how our site is used.', 'Usando análisis agregados para entender cómo se usa nuestro sitio.')}</li>
                            <li><strong>{tr('To coordinate events:', 'Para coordinar eventos:')}</strong> {tr('Managing sign-ups and accessibility requests to ensure safe, inclusive events.', 'Gestionando inscripciones y solicitudes de accesibilidad para garantizar eventos seguros e inclusivos.')}</li>
                            <li><strong>{tr('To process donations:', 'Para procesar donaciones:')}</strong> {tr('Facilitating secure and recognized transactions through our third-party donation platform (Zeffy).', 'Facilitando transacciones seguras y reconocidas a través de nuestra plataforma de donación de terceros (Zeffy).')}</li>
                            <li><strong>{tr('To authenticate users:', 'Para autenticar usuarios:')}</strong> {tr('Verifying the identity of board members, volunteers, and administrators who access our internal dashboard.', 'Verificando la identidad de miembros de la junta, voluntarios y administradores que acceden a nuestro panel interno.')}</li>
                            <li><strong>{tr('To send periodic emails:', 'Para enviar correos periódicos:')}</strong> {tr('Sending users information and updates pertaining to their involvement, when they have consented to receive such communications.', 'Enviando a los usuarios información y actualizaciones relacionadas con su participación, cuando han consentido recibir dichas comunicaciones.')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('California Consumer Privacy Act (CCPA) Privacy Rights', 'Derechos de Privacidad de la Ley de Privacidad del Consumidor de California (CCPA)')}</h3>
                        <p>{tr("If you are a California resident, you are granted specific rights regarding access to your personal information. Aaria's Blue Elephant complies fully with the CCPA:", "Si eres residente de California, se te otorgan derechos específicos respecto al acceso a tu información personal. Aaria's Blue Elephant cumple totalmente con la CCPA:")}</p>
                        <ul>
                            <li><strong>{tr('Right to Know:', 'Derecho a Saber:')}</strong> {tr('You have the right to request that we disclose certain information to you about our collection and use of your personal information over the past 12 months.', 'Tienes derecho a solicitar que te revelemos cierta información sobre nuestra recopilación y uso de tu información personal durante los últimos 12 meses.')}</li>
                            <li><strong>{tr('Right to Delete:', 'Derecho a Eliminar:')}</strong> {tr('You have the right to request that we delete any of your personal information that we collected from you and retained, subject to certain exceptions.', 'Tienes derecho a solicitar que eliminemos cualquier información personal tuya que hayamos recopilado y retenido, sujeto a ciertas excepciones.')}</li>
                            <li><strong>{tr('Right to Opt-Out of Sale:', 'Derecho a Optar por No Vender:')}</strong> {tr('We do not sell your personal data. We are a nonprofit organization dedicated to our community. However, you maintain the right to direct us not to sell or share your personal information.', 'No vendemos tus datos personales. Somos una organización sin fines de lucro dedicada a nuestra comunidad. Sin embargo, mantienes el derecho de indicarnos que no vendamos ni compartamos tu información personal.')}</li>
                            <li><strong>{tr('Non-Discrimination:', 'No Discriminación:')}</strong> {tr('We will not discriminate against you for exercising any of your CCPA rights.', 'No te discriminaremos por ejercer cualquiera de tus derechos bajo la CCPA.')}</li>
                        </ul>
                        <p>{tr('To exercise your CCPA rights, please submit a request to us at', 'Para ejercer tus derechos de la CCPA, por favor envíanos una solicitud a')} <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a>. {tr('We will verify your request and respond within the timeframe mandated by California law (typically 45 days).', 'Verificaremos tu solicitud y responderemos dentro del plazo exigido por la ley de California (generalmente 45 días).')}</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 2: Data Collection & Authentication — NEW */}
                    <div id="data-collection" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('2. Data Collection & Authentication', '2. Recopilación de Datos y Autenticación')}</h2>
                        <p>
                            {tr('Our primary website hosted at', 'Nuestro sitio web principal, alojado en')} <strong>aariasblueelephant.org</strong> {tr('is a', 'es un')} <strong>{tr('static website', 'sitio web estático')}</strong> {tr("hosted on GitHub Pages. In its static form, we do not independently collect or store personal information beyond standard browser cookies and your browser's local storage (used for theme preferences).", "alojado en GitHub Pages. En su forma estática, no recopilamos ni almacenamos de forma independiente información personal más allá de las cookies estándar del navegador y el almacenamiento local de tu navegador (usado para preferencias de tema).")}
                        </p>
                        <p>
                            {tr('However, our website also provides an authenticated', 'Sin embargo, nuestro sitio web también ofrece un')} <strong>{tr('Volunteer and Admin Dashboard', 'Panel de Voluntarios y Administradores')}</strong>{tr(', which operates as an application and collects additional user data. This dashboard is powered by', ' autenticado, que funciona como una aplicación y recopila datos adicionales de usuarios. Este panel está impulsado por')} <strong>Supabase</strong> {tr('(a third-party backend-as-a-service platform) and uses', '(una plataforma de backend como servicio de terceros) y usa')} <strong>Google OAuth 2.0</strong> {tr('for authentication.', 'para la autenticación.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Information Collected During Authentication', 'Información Recopilada Durante la Autenticación')}</h3>
                        <p>{tr('When you create an account or log in via Google OAuth, we collect and store the following information via Supabase:', 'Cuando creas una cuenta o inicias sesión a través de Google OAuth, recopilamos y almacenamos la siguiente información mediante Supabase:')}</p>
                        <ul>
                            <li><strong>{tr('Full name', 'Nombre completo')}</strong> {tr('as provided by your Google account', 'proporcionado por tu cuenta de Google')}</li>
                            <li><strong>{tr('Email address', 'Dirección de correo electrónico')}</strong> {tr('associated with your Google account', 'asociada a tu cuenta de Google')}</li>
                            <li><strong>{tr('Profile photo URL', 'URL de la foto de perfil')}</strong> {tr('from your Google account (if available)', 'de tu cuenta de Google (si está disponible)')}</li>
                            <li><strong>{tr('Authentication tokens', 'Tokens de autenticación')}</strong> {tr('and session identifiers used to maintain your logged-in state', 'e identificadores de sesión usados para mantener tu estado de sesión iniciada')}</li>
                            <li><strong>{tr('Account role', 'Rol de la cuenta')}</strong> {tr('(e.g., Volunteer, Donor, Board Member) assigned by our administrators', '(por ejemplo, Voluntario, Donante, Miembro de la Junta) asignado por nuestros administradores')}</li>
                            <li><strong>{tr('Timestamps', 'Marcas de tiempo')}</strong> {tr('of account creation and last login', 'de creación de la cuenta y del último inicio de sesión')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Third-Party Processors', 'Procesadores de Terceros')}</h3>
                        <ul>
                            <li><strong>{tr('Supabase (supabase.io):', 'Supabase (supabase.io):')}</strong> {tr('Acts as our database and authentication backend. All authentication data is stored in Supabase-managed infrastructure. Supabase is SOC 2 Type II compliant. Please review', 'Funciona como nuestra base de datos y backend de autenticación. Todos los datos de autenticación se almacenan en infraestructura gestionada por Supabase. Supabase cumple con SOC 2 Tipo II. Por favor revisa la')} <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400">{tr("Supabase's Privacy Policy", 'Política de Privacidad de Supabase')}</a>.</li>
                            <li><strong>{tr('Google OAuth 2.0:', 'Google OAuth 2.0:')}</strong> {tr('Used for secure, passwordless sign-in. We only receive the data that Google provides upon your explicit authorization. Please review', 'Se usa para un inicio de sesión seguro y sin contraseña. Solo recibimos los datos que Google proporciona bajo tu autorización explícita. Por favor revisa la')} <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400">{tr("Google's Privacy Policy", 'Política de Privacidad de Google')}</a>.</li>
                            <li><strong>Zeffy:</strong> {tr('Our third-party donation processing platform handles all payment card data. We do not store financial information on our servers.', 'Nuestra plataforma de procesamiento de donaciones de terceros maneja todos los datos de tarjetas de pago. No almacenamos información financiera en nuestros servidores.')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Data Retention', 'Retención de Datos')}</h3>
                        <p>
                            {tr('Account data is retained for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at', 'Los datos de la cuenta se conservan mientras tu cuenta esté activa o según sea necesario para prestar los servicios. Puedes solicitar la eliminación de tu cuenta y los datos asociados en cualquier momento contactándonos en')} <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a>. {tr('We will process all deletion requests within 30 days.', 'Procesaremos todas las solicitudes de eliminación dentro de 30 días.')}
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 3: Age Restrictions & COPPA — NEW */}
                    <div id="age-restrictions" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('3. Age Restrictions & Child Protection (COPPA)', '3. Restricciones de Edad y Protección Infantil (COPPA)')}</h2>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-xl my-6">
                            <p className="font-bold text-amber-800 dark:text-amber-300 m-0">
                                ⚠️ {tr("Important Notice: Aaria's Blue Elephant does not authorize accounts for individuals under the age of 13.", "Aviso Importante: Aaria's Blue Elephant no autoriza cuentas para personas menores de 13 años.")}
                            </p>
                        </div>

                        <p>
                            {tr('In compliance with the', 'De conformidad con la')} <strong>{tr("Children's Online Privacy Protection Act (COPPA)", 'Ley de Protección de la Privacidad Infantil en Línea (COPPA)')}</strong> {tr('and applicable state child protection laws, our authenticated application is strictly for use by adults (individuals who are 13 years of age or older).', 'y las leyes estatales aplicables de protección infantil, nuestra aplicación autenticada es estrictamente para uso de adultos (personas de 13 años de edad o más).')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Account Eligibility', 'Elegibilidad de Cuenta')}</h3>
                        <ul>
                            <li>{tr('You must be at least', 'Debes tener al menos')} <strong>{tr('13 years of age', '13 años de edad')}</strong> {tr('to create an account or access our volunteer/admin dashboard.', 'para crear una cuenta o acceder a nuestro panel de voluntarios/administradores.')}</li>
                            <li>{tr('By creating an account, you represent and warrant that you are 13 years of age or older.', 'Al crear una cuenta, declaras y garantizas que tienes 13 años de edad o más.')}</li>
                            <li>{tr('Accounts are intended for adult volunteers, donors, and board members — not the children who participate in our events.', 'Las cuentas están destinadas a voluntarios, donantes y miembros de la junta adultos — no a los niños que participan en nuestros eventos.')}</li>
                            <li>{tr('If we become aware that a user is under 13, we will immediately disable that account and delete all associated data.', 'Si nos enteramos de que un usuario es menor de 13 años, deshabilitaremos de inmediato esa cuenta y eliminaremos todos los datos asociados.')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr("Children's Participation", 'Participación de los Niños')}</h3>
                        <p>
                            {tr('While our mission is to serve neurodivergent and neurotypical children at community events, all', 'Si bien nuestra misión es servir a niños neurodivergentes y neurotípicos en eventos comunitarios, toda')} <strong>{tr('data collection through our digital platform is the responsibility of the attending adult', 'recopilación de datos a través de nuestra plataforma digital es responsabilidad del adulto acompañante')}</strong> {tr('(parent or legal guardian). We do not collect personal data directly from children. Parents who share any information about their children in testimonials or event registrations do so on behalf of their child as legal guardians.', '(padre, madre o tutor legal). No recopilamos datos personales directamente de los niños. Los padres que comparten información sobre sus hijos en testimonios o inscripciones a eventos lo hacen en nombre de su hijo como tutores legales.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Our Free Games for Children', 'Nuestros Juegos Gratuitos para Niños')}</h3>
                        <p>
                            {tr("Our website hosts free browser games designed for children (including Aaria's Floating Islands, Block Craft 3D, Aaria's Elly-Tubbies, Aaria's Dough Lab, Magnet Blocks, Aaria's Road Safety Heroes, Aaria's Grocery Store, Aaria's Day Planner, Aaria's Feelings Faces, Aaria's Rhythm & Calm, Aaria's Flying Elephant, and Aaria's Helping Hands). These games were deliberately built to", "Nuestro sitio web aloja juegos de navegador gratuitos diseñados para niños (incluyendo Aaria's Floating Islands, Block Craft 3D, Aaria's Elly-Tubbies, Aaria's Dough Lab, Magnet Blocks, Aaria's Road Safety Heroes, Aaria's Grocery Store, Aaria's Day Planner, Aaria's Feelings Faces, Aaria's Rhythm & Calm, Aaria's Flying Elephant, y Aaria's Helping Hands). Estos juegos fueron diseñados deliberadamente para")} <strong>{tr('collect no personal information from children', 'no recopilar ninguna información personal de los niños')}</strong>:
                        </p>
                        <ul>
                            <li><strong>{tr('No accounts, no sign-in.', 'Sin cuentas, sin inicio de sesión.')}</strong> {tr('The games never ask a child to register, and playing them requires no personal information.', 'Los juegos nunca piden a un niño que se registre, y jugarlos no requiere ninguna información personal.')}</li>
                            <li><strong>{tr('Everything stays on your device.', 'Todo permanece en tu dispositivo.')}</strong> {tr("Game progress, settings, creations, and in-game photos are saved only in your browser's local storage on your own device. None of it is transmitted to us or to any third party, and we cannot see it.", 'El progreso del juego, la configuración, las creaciones y las fotos dentro del juego se guardan solo en el almacenamiento local de tu navegador en tu propio dispositivo. Nada de esto se transmite a nosotros ni a ningún tercero, y no podemos verlo.')}</li>
                            <li><strong>{tr('Names are optional and local.', 'Los nombres son opcionales y locales.')}</strong> {tr('Some games let a child enter a first name or nickname so the game can greet them. That name is stored only on your device and is never sent anywhere. A nickname works just as well as a real name.', 'Algunos juegos permiten que un niño ingrese un primer nombre o apodo para que el juego pueda saludarlo. Ese nombre se almacena solo en tu dispositivo y nunca se envía a ningún lado. Un apodo funciona igual de bien que un nombre real.')}</li>
                            <li><strong>{tr('No advertising and no tracking in the games.', 'Sin publicidad ni rastreo en los juegos.')}</strong> {tr('The game pages contain no ads, no ad networks, and no third-party analytics or tracking scripts. The only thing we count is an', 'Las páginas de los juegos no contienen anuncios, redes publicitarias, ni scripts de análisis o rastreo de terceros. Lo único que contamos es un')} <strong>{tr('anonymous play tally', 'conteo anónimo de partidas')}</strong> {tr('— when a game starts, it tells us "this game was played once" and nothing else: no name, no account, no cookie, no device identifier, no IP address stored. We use these totals solely to understand which games children enjoy most.', '— cuando un juego comienza, nos indica "este juego se jugó una vez" y nada más: sin nombre, sin cuenta, sin cookie, sin identificador de dispositivo, sin dirección IP almacenada. Usamos estos totales únicamente para entender qué juegos disfrutan más los niños.')}</li>
                            <li><strong>{tr('Sharing is a file you control.', 'Compartir es un archivo que tú controlas.')}</strong> {tr('Some games can export a creation or replay as a small file so a child can share it with a friend. These files contain only game data (blocks, paths, dough shapes) — never a name or any personal information. Sharing happens entirely outside our systems, through whatever channel the parent chooses.', 'Algunos juegos pueden exportar una creación o repetición como un pequeño archivo para que un niño lo comparta con un amigo. Estos archivos contienen solo datos del juego (bloques, rutas, formas de masa) — nunca un nombre ni información personal. Compartir ocurre completamente fuera de nuestros sistemas, por el canal que el padre elija.')}</li>
                            <li><strong>{tr('Voice features use your browser.', 'Las funciones de voz usan tu navegador.')}</strong> {tr("Read-aloud narration uses your device's built-in speech. One game offers an optional voice-answer mode that uses your browser's speech-recognition service; depending on your browser, audio may be processed by your browser's vendor (for example, Google for Chrome) to convert speech to text. We never receive or store any audio. This mode is off by default and can be disabled in the game's settings.", 'La narración de lectura en voz alta usa la voz integrada de tu dispositivo. Un juego ofrece un modo opcional de respuesta por voz que usa el servicio de reconocimiento de voz de tu navegador; dependiendo de tu navegador, el audio puede ser procesado por el proveedor de tu navegador (por ejemplo, Google para Chrome) para convertir voz a texto. Nunca recibimos ni almacenamos ningún audio. Este modo está desactivado por defecto y puede desactivarse en la configuración del juego.')}</li>
                            <li><strong>{tr('Printables stay with you.', 'Los imprimibles se quedan contigo.')}</strong> {tr('Certificates or photos a child can download are generated on your device and are not uploaded to us.', 'Los certificados o fotos que un niño puede descargar se generan en tu dispositivo y no se suben a nosotros.')}</li>
                        </ul>
                        <p>
                            <strong>{tr('Parents:', 'Padres:')}</strong> {tr('you can erase all game data at any time by clearing your browser\'s site data for this website, or by using the "start over" / reset options inside each game. Several games also include a parent- or guardian-only summary panel (gated behind a simple adult question) showing what your child practiced — that summary is generated from the on-device data and is likewise never transmitted to us.', 'puedes borrar todos los datos del juego en cualquier momento eliminando los datos del sitio en tu navegador para este sitio web, o usando las opciones "empezar de nuevo" / reiniciar dentro de cada juego. Varios juegos también incluyen un panel de resumen solo para padres o tutores (protegido por una simple pregunta para adultos) que muestra lo que tu hijo practicó — ese resumen se genera a partir de los datos en el dispositivo y de igual manera nunca se nos transmite.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Parental Consent', 'Consentimiento Parental')}</h3>
                        <p>
                            {tr('If you believe that a child under 13 has provided us with personal information without parental consent, please contact us immediately at', 'Si crees que un niño menor de 13 años nos ha proporcionado información personal sin el consentimiento de los padres, por favor contáctanos de inmediato en')} <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a> {tr('so that we can promptly investigate and take appropriate action, including account deletion.', 'para que podamos investigar de inmediato y tomar las medidas apropiadas, incluyendo la eliminación de la cuenta.')}
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 4: User-Generated Content — NEW */}
                    <div id="user-content" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('4. User-Generated Content', '4. Contenido Generado por Usuarios')}</h2>
                        <p>
                            {tr('Our platform allows authorized users (board members and administrators) to submit testimonials, event posts, and community stories that may be displayed publicly on our website. The following terms govern all user-generated content (UGC).', 'Nuestra plataforma permite a usuarios autorizados (miembros de la junta y administradores) enviar testimonios, publicaciones de eventos e historias comunitarias que pueden mostrarse públicamente en nuestro sitio web. Los siguientes términos rigen todo el contenido generado por usuarios (UGC).')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Prohibited Content', 'Contenido Prohibido')}</h3>
                        <p>{tr("By submitting any content to Aaria's Blue Elephant's platform, you agree that you will not post content that:", "Al enviar cualquier contenido a la plataforma de Aaria's Blue Elephant, aceptas que no publicarás contenido que:")}</p>
                        <ul>
                            <li>{tr('Violates any applicable local, state, national, or international law or regulation', 'Viole cualquier ley o normativa local, estatal, nacional o internacional aplicable')}</li>
                            <li>{tr('Infringes upon the intellectual property, privacy, or publicity rights of any person', 'Infrinja los derechos de propiedad intelectual, privacidad o publicidad de cualquier persona')}</li>
                            <li>{tr("Contains personal identifying information about a child without explicit parental consent", 'Contenga información personal identificable sobre un niño sin el consentimiento explícito de los padres')}</li>
                            <li>{tr('Is hateful, abusive, discriminatory, defamatory, obscene, or threatening', 'Sea odioso, abusivo, discriminatorio, difamatorio, obsceno o amenazante')}</li>
                            <li>{tr('Constitutes unauthorized advertising, spam, or solicitation', 'Constituya publicidad no autorizada, spam o solicitación')}</li>
                            <li>{tr('Violates the privacy of any individual or discloses confidential information', 'Viole la privacidad de cualquier individuo o divulgue información confidencial')}</li>
                            <li>{tr('Is contrary to our mission of inclusive, compassionate community building', 'Sea contrario a nuestra misión de construir una comunidad inclusiva y compasiva')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Content Responsibility & Liability', 'Responsabilidad del Contenido y Responsabilidad Legal')}</h3>
                        <p>
                            <strong>{tr('You are solely responsible for the content you submit.', 'Eres el único responsable del contenido que envías.')}</strong> {tr("Aaria's Blue Elephant does not pre-screen all user-generated content, but we reserve the right to review, edit, or remove any content that violates these terms or that we determine, in our sole discretion, is harmful to our community or mission.", "Aaria's Blue Elephant no revisa previamente todo el contenido generado por usuarios, pero nos reservamos el derecho de revisar, editar o eliminar cualquier contenido que viole estos términos o que determinemos, a nuestra entera discreción, que es perjudicial para nuestra comunidad o misión.")}
                        </p>
                        <p>
                            {tr("By submitting content, you grant Aaria's Blue Elephant a non-exclusive, royalty-free, perpetual license to use, display, and distribute that content in connection with our mission and services. You represent that you hold all necessary rights to grant this license.", "Al enviar contenido, le otorgas a Aaria's Blue Elephant una licencia no exclusiva, libre de regalías y perpetua para usar, mostrar y distribuir ese contenido en relación con nuestra misión y servicios. Declaras que posees todos los derechos necesarios para otorgar esta licencia.")}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr("Testimonials and Children's Images", 'Testimonios e Imágenes de Niños')}</h3>
                        <p>
                            {tr('If you submit a testimonial that includes reference to or images of children, you affirm that you are the parent or legal guardian of all minors mentioned or depicted, and that you consent to that content being displayed on our public website. We will honor any subsequent requests to remove such content.', 'Si envías un testimonio que incluye referencia a o imágenes de niños, afirmas que eres el padre, madre o tutor legal de todos los menores mencionados o representados, y que consientes que ese contenido se muestre en nuestro sitio web público. Honraremos cualquier solicitud posterior de eliminar dicho contenido.')}
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 5: Cookie Policy */}
                    <div id="cookie-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('5. Cookie Policy', '5. Política de Cookies')}</h2>
                        <p>
                            {tr('Like many interactive websites, aariasblueelephant.org uses "cookies" and browser local storage. A cookie is a small piece of data specifically generated to be saved on a user\'s computer or mobile device.', 'Como muchos sitios web interactivos, aariasblueelephant.org usa "cookies" y almacenamiento local del navegador. Una cookie es un pequeño fragmento de datos generado específicamente para guardarse en la computadora o dispositivo móvil de un usuario.')}
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('How We Use Cookies', 'Cómo Usamos las Cookies')}</h3>
                        <ul>
                            <li><strong>{tr('Essential Cookies:', 'Cookies Esenciales:')}</strong> {tr('We use essential cookies to perform vital functions, such as verifying user identity when logging into our Volunteer and Admin dashboards via Supabase authentication sessions.', 'Usamos cookies esenciales para realizar funciones vitales, como verificar la identidad del usuario al iniciar sesión en nuestros paneles de Voluntarios y Administradores mediante sesiones de autenticación de Supabase.')}</li>
                            <li><strong>{tr('Functionality Cookies / Local Storage:', 'Cookies de Funcionalidad / Almacenamiento Local:')}</strong> {tr('We use browser local storage to remember your preferences (like the Dark/Light theme mode) to make your visit smoother. This data is stored only on your device and not transmitted to our servers.', 'Usamos el almacenamiento local del navegador para recordar tus preferencias (como el modo de tema Oscuro/Claro) para hacer tu visita más fluida. Estos datos se almacenan solo en tu dispositivo y no se transmiten a nuestros servidores.')}</li>
                            <li><strong>{tr('Analytics Cookies:', 'Cookies de Análisis:')}</strong> {tr('We may use analytical cookies to observe how users interact with our site, enabling us to continuously improve our inclusive digital experience. We do not use tracking cookies for advertising purposes.', 'Podemos usar cookies analíticas para observar cómo los usuarios interactúan con nuestro sitio, permitiéndonos mejorar continuamente nuestra experiencia digital inclusiva. No usamos cookies de rastreo con fines publicitarios.')}</li>
                        </ul>
                        <p>{tr('You can choose to set your web browser to refuse cookies, or to alert you when cookies are being sent. If you do so, note that some parts of the site (like the dashboard auth) may not function properly.', 'Puedes optar por configurar tu navegador web para rechazar cookies, o para alertarte cuando se envíen cookies. Si lo haces, ten en cuenta que algunas partes del sitio (como la autenticación del panel) pueden no funcionar correctamente.')}</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 6: Cybersecurity & Data Protection — NEW/EXPANDED */}
                    <div id="cybersecurity" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('6. Cybersecurity & Data Protection', '6. Ciberseguridad y Protección de Datos')}</h2>
                        <p>
                            {tr("Because we operate an application that collects user login information and may store community data, we take our cybersecurity responsibilities seriously. We have implemented the following safeguards to protect authorized users' data:", 'Debido a que operamos una aplicación que recopila información de inicio de sesión de usuarios y puede almacenar datos comunitarios, tomamos en serio nuestras responsabilidades de ciberseguridad. Hemos implementado las siguientes salvaguardas para proteger los datos de los usuarios autorizados:')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Technical Safeguards', 'Salvaguardas Técnicas')}</h3>
                        <ul>
                            <li><strong>{tr('Encrypted Authentication:', 'Autenticación Cifrada:')}</strong> {tr('All user authentication is handled via Google OAuth 2.0 and Supabase. We never store raw passwords. Authentication tokens are encrypted in transit using industry-standard TLS/HTTPS protocols.', 'Toda la autenticación de usuarios se maneja a través de Google OAuth 2.0 y Supabase. Nunca almacenamos contraseñas sin cifrar. Los tokens de autenticación se cifran en tránsito usando protocolos TLS/HTTPS estándar de la industria.')}</li>
                            <li><strong>{tr('Row-Level Security (RLS):', 'Seguridad a Nivel de Fila (RLS):')}</strong> {tr('Our Supabase database enforces row-level security policies so that users can only access data they are explicitly authorized to view.', 'Nuestra base de datos de Supabase aplica políticas de seguridad a nivel de fila para que los usuarios solo puedan acceder a los datos que están explícitamente autorizados a ver.')}</li>
                            <li><strong>{tr('HTTPS Everywhere:', 'HTTPS en Todas Partes:')}</strong> {tr('Our entire website is served over HTTPS, preventing man-in-the-middle interception of data.', 'Todo nuestro sitio web se sirve a través de HTTPS, evitando la interceptación de datos por intermediarios (man-in-the-middle).')}</li>
                            <li><strong>{tr('Minimal Data Collection:', 'Recopilación Mínima de Datos:')}</strong> {tr('We only collect the data necessary to operate our service. We do not collect financial data, government IDs, or other highly sensitive personal information.', 'Solo recopilamos los datos necesarios para operar nuestro servicio. No recopilamos datos financieros, identificaciones gubernamentales, ni otra información personal altamente sensible.')}</li>
                            <li><strong>{tr('Third-Party Security:', 'Seguridad de Terceros:')}</strong> {tr('We rely on Supabase (SOC 2 Type II compliant) and Google (ISO 27001, SOC 2/3 certified) as our authentication and data infrastructure providers, benefiting from enterprise-grade security.', 'Confiamos en Supabase (con certificación SOC 2 Tipo II) y Google (certificado ISO 27001, SOC 2/3) como nuestros proveedores de infraestructura de autenticación y datos, beneficiándonos de seguridad de nivel empresarial.')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Our Cybersecurity Obligations', 'Nuestras Obligaciones de Ciberseguridad')}</h3>
                        <p>
                            {tr('By operating an application that collects login information, we acknowledge our responsibility to:', 'Al operar una aplicación que recopila información de inicio de sesión, reconocemos nuestra responsabilidad de:')}
                        </p>
                        <ul>
                            <li>{tr('Maintain the confidentiality and integrity of all user data we collect', 'Mantener la confidencialidad e integridad de todos los datos de usuarios que recopilamos')}</li>
                            <li>{tr('Promptly investigate and respond to any suspected security incidents or data breaches', 'Investigar y responder con prontitud a cualquier incidente de seguridad sospechado o filtración de datos')}</li>
                            <li>{tr('Notify affected users and relevant authorities in the event of a confirmed data breach, as required by California law (Cal. Civ. Code § 1798.29) and applicable regulations', 'Notificar a los usuarios afectados y a las autoridades pertinentes en caso de una filtración de datos confirmada, según lo exige la ley de California (Cal. Civ. Code § 1798.29) y las normativas aplicables')}</li>
                            <li>{tr('Regularly review and update our security practices as technology and threats evolve', 'Revisar y actualizar regularmente nuestras prácticas de seguridad a medida que evolucionan la tecnología y las amenazas')}</li>
                            <li>{tr('Limit access to user data to only staff or volunteers who require it to perform their organizational role', 'Limitar el acceso a los datos de usuarios solo al personal o voluntarios que lo requieran para desempeñar su función organizacional')}</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Data Breach Notification', 'Notificación de Filtración de Datos')}</h3>
                        <p>
                            {tr('In the event of a data security breach that is likely to result in harm to our users, we will notify affected individuals by email within', 'En caso de una filtración de seguridad de datos que probablemente resulte en daño a nuestros usuarios, notificaremos a las personas afectadas por correo electrónico dentro de')} <strong>{tr('72 hours', '72 horas')}</strong> {tr('of becoming aware of the breach, to the extent practicable. Notification will include the nature of the breach, the data affected, and the steps we are taking to address it.', 'de tomar conocimiento de la filtración, en la medida de lo posible. La notificación incluirá la naturaleza de la filtración, los datos afectados y las medidas que estamos tomando para abordarla.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Limitations', 'Limitaciones')}</h3>
                        <p>
                            {tr('While we employ robust safeguards, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of data transmitted to or from our site. Users share information at their own risk, and we recommend using strong, unique passwords for your Google account and enabling two-factor authentication.', 'Si bien empleamos salvaguardas robustas, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. No podemos garantizar la seguridad absoluta de los datos transmitidos hacia o desde nuestro sitio. Los usuarios comparten información bajo su propio riesgo, y recomendamos usar contraseñas fuertes y únicas para tu cuenta de Google y habilitar la autenticación de dos factores.')}
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 7: Terms of Service */}
                    <div id="terms-of-service" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('7. Terms of Service', '7. Términos de Servicio')}</h2>
                        <p>
                            {tr('By accessing aariasblueelephant.org, you signify your agreement to these terms of service and our commitment to maintaining a respectful, safe, and inclusive environment.', 'Al acceder a aariasblueelephant.org, manifiestas tu acuerdo con estos términos de servicio y nuestro compromiso de mantener un ambiente respetuoso, seguro e inclusivo.')}
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Use of Services & Community Conduct', 'Uso de los Servicios y Conducta de la Comunidad')}</h3>
                        <p>{tr("Aaria's Blue Elephant relies on compassion and understanding. In using our site to register for events, volunteer, or share stories, you agree not to submit or distribute content that is hateful, abusive, illegal, or contrary to our mission of neurodivergent and neurotypical inclusivity.", "Aaria's Blue Elephant se basa en la compasión y la comprensión. Al usar nuestro sitio para registrarte en eventos, ser voluntario o compartir historias, aceptas no enviar ni distribuir contenido que sea odioso, abusivo, ilegal, o contrario a nuestra misión de inclusión neurodivergente y neurotípica.")}</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Account Eligibility', 'Elegibilidad de Cuenta')}</h3>
                        <p>
                            {tr('You must be at least 13 years of age to use our authenticated services. By creating an account, you represent that you meet this age requirement. We reserve the right to immediately terminate any account that we determine is held by a person under the age of 13.', 'Debes tener al menos 13 años de edad para usar nuestros servicios autenticados. Al crear una cuenta, declaras que cumples con este requisito de edad. Nos reservamos el derecho de terminar de inmediato cualquier cuenta que determinemos que pertenece a una persona menor de 13 años.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Intellectual Property', 'Propiedad Intelectual')}</h3>
                        <p>{tr('The content, organization, graphics, design, logos (including Aaria the Elephant), and other matters related to the Site are protected under applicable copyrights and intellectual property laws. The copying, redistribution, or publication of any such matters is strictly prohibited without our express written consent.', 'El contenido, la organización, los gráficos, el diseño, los logotipos (incluyendo a Aaria the Elephant) y otros asuntos relacionados con el Sitio están protegidos bajo las leyes de derechos de autor y propiedad intelectual aplicables. La copia, redistribución o publicación de cualquiera de estos elementos está estrictamente prohibida sin nuestro consentimiento expreso por escrito.')}</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Disclaimer of Warranties & Liability Limitation', 'Renuncia de Garantías y Limitación de Responsabilidad')}</h3>
                        <p>{tr('The site and its services are provided on an "as-is" basis. While we strive for perfection and continuous uptime, we cannot guarantee that the site will be error-free or uninterrupted. Aaria\'s Blue Elephant is not liable for indirect, incidental, or consequential damages arising from the use of our digital platforms.', 'El sitio y sus servicios se proporcionan "tal cual". Si bien nos esforzamos por la perfección y la disponibilidad continua, no podemos garantizar que el sitio esté libre de errores o funcione sin interrupciones. Aaria\'s Blue Elephant no es responsable de daños indirectos, incidentales o consecuentes derivados del uso de nuestras plataformas digitales.')}</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 8: Donation Policy */}
                    <div id="donation-policy" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('8. Donation Policy', '8. Política de Donaciones')}</h2>
                        <p>
                            {tr("Our guarantee is simple: all events hosted by Aaria's Blue Elephant are 100% free and inclusive for every child. We rely fundamentally on the generosity of the community to make this happen.", "Nuestra garantía es simple: todos los eventos organizados por Aaria's Blue Elephant son 100% gratuitos e inclusivos para cada niño. Dependemos fundamentalmente de la generosidad de la comunidad para lograrlo.")}
                        </p>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Acceptance and Allocation', 'Aceptación y Asignación')}</h3>
                        <p>{tr('We accept monetary donations via our secure third-party portals, and occasionally physical in-kind donations of specialized sensory equipment. All donations are used to further the direct mission of the charity, specifically to fund event venues, trained staff, accessibility resources, and operational expenses.', 'Aceptamos donaciones monetarias a través de nuestros portales seguros de terceros, y ocasionalmente donaciones físicas en especie de equipo sensorial especializado. Todas las donaciones se usan para promover directamente la misión de la organización benéfica, específicamente para financiar sedes de eventos, personal capacitado, recursos de accesibilidad y gastos operativos.')}</p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Refunds & Tax Deductibility', 'Reembolsos y Deducibilidad Fiscal')}</h3>
                        <p>{tr('As standard practice for non-profit organizations, donations are non-refundable unless there has been a palpable error in the transaction.', 'Como práctica estándar para organizaciones sin fines de lucro, las donaciones no son reembolsables a menos que haya habido un error evidente en la transacción.')} <strong>{tr('Please Note:', 'Nota:')}</strong> {tr("Aaria's Blue Elephant is currently operating with its 501(c)(3) tax-exempt status. Donors should consult their tax advisors regarding the current deductibility of their contributions.", "Aaria's Blue Elephant opera actualmente con su estatus de exención fiscal 501(c)(3). Los donantes deben consultar a sus asesores fiscales sobre la deducibilidad actual de sus contribuciones.")}</p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 9: Vulnerability Disclosure Policy */}
                    <div id="vulnerability-disclosure" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('9. Vulnerability Disclosure Policy', '9. Política de Divulgación de Vulnerabilidades')}</h2>
                        <p>
                            {tr("Security is a top priority for protecting our users' data. If you are a security researcher and have discovered a security vulnerability in one of our platforms, we appreciate your help in disclosing it to us responsibly.", 'La seguridad es una prioridad máxima para proteger los datos de nuestros usuarios. Si eres un investigador de seguridad y has descubierto una vulnerabilidad de seguridad en una de nuestras plataformas, agradecemos tu ayuda para reportárnosla de manera responsable.')}
                        </p>

                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6">{tr('Safe Harbor', 'Puerto Seguro')}</h3>
                        <p>{tr('We will not take legal action against you or ask law enforcement to investigate you if you comply with the following guidelines:', 'No tomaremos acciones legales en tu contra ni pediremos a las autoridades que te investiguen si cumples con las siguientes pautas:')}</p>
                        <ul>
                            <li>{tr('Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our service.', 'Haz un esfuerzo de buena fe para evitar violaciones de privacidad, destrucción de datos e interrupción o degradación de nuestro servicio.')}</li>
                            <li>{tr('Do not exploit a security issue you discover for any reason (e.g. no dumping of data, no extortion).', 'No explotes ningún problema de seguridad que descubras por ningún motivo (por ejemplo, sin volcado de datos, sin extorsión).')}</li>
                            <li>{tr('Keep the vulnerability confidential until we are able to resolve it.', 'Mantén la vulnerabilidad confidencial hasta que podamos resolverla.')}</li>
                        </ul>
                        <p>{tr('Please report any findings to', 'Por favor reporta cualquier hallazgo a')} <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400">info@aariasblueelephant.org</a></p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Section 10: Security Acknowledgement */}
                    <div id="security-acknowledgment" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{tr('10. Security Acknowledgement', '10. Reconocimiento de Seguridad')}</h2>
                        <p>
                            {tr('We wish to extend our deep gratitude to the ethical hackers, developers, and researchers from initiatives like Free For Charity who volunteer their time to identify and responsibly disclose security flaws. Your efforts ensure that charitable platforms like ours remain safe havens for marginalized and targeted groups.', 'Deseamos extender nuestra profunda gratitud a los hackers éticos, desarrolladores e investigadores de iniciativas como Free For Charity que ofrecen voluntariamente su tiempo para identificar y divulgar responsablemente fallas de seguridad. Sus esfuerzos aseguran que plataformas benéficas como la nuestra sigan siendo refugios seguros para grupos marginados y vulnerables.')}
                        </p>
                    </div>

                    <hr className="my-12 border-slate-200 dark:border-slate-800" />

                    {/* Contact Block */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 mt-16">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{tr('Legal Entity Information', 'Información de la Entidad Legal')}</h4>
                        <ul className="space-y-4 m-0 p-0 list-none text-slate-700 dark:text-slate-300">
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">{tr('Organization:', 'Organización:')}</strong> Aaria's Blue Elephant
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">{tr('Entity No:', 'N.º de Entidad:')}</strong> B20250299015
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">{tr('Tax Status:', 'Estatus Fiscal:')}</strong> {tr('501(c)(3) Nonprofit', 'Organización sin Fines de Lucro 501(c)(3)')}
                            </li>
                            <li className="flex items-center gap-3">
                                <strong className="text-slate-900 dark:text-white w-32">{tr('Email Contact:', 'Correo de Contacto:')}</strong> <a href="mailto:info@aariasblueelephant.org" className="text-sky-600 dark:text-sky-400 hover:underline">info@aariasblueelephant.org</a>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
