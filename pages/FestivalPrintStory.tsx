import React from 'react';
import { Link } from 'react-router-dom';
import { tr } from '../lib/lang';

/*
 * Unlisted story page (not in the navbar) — written for the 4over4 community
 * promotion, which asks for a published post with a backlink. The link is a
 * paid one, so it carries rel="sponsored" and the post says so at the bottom.
 */

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-10 text-2xl font-bold text-slate-900 dark:text-white">{children}</h2>
);

const FestivalPrintStory: React.FC = () => (
  <div className="bg-white py-12 transition-colors duration-300 dark:bg-slate-950 sm:py-16">
    <article className="mx-auto -mt-8 max-w-3xl px-4 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
        {tr('Inclusion Festival · Behind the scenes', 'Festival de Inclusión · Detrás de escena')}
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        {tr('The Paper Part: What Printing for Our Inclusion Festival Taught Us',
          'La parte en papel: lo que aprendimos al imprimir para nuestro Festival de Inclusión')}
      </h1>

      <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          {tr("On Sunday, November 1, Aaria's Blue Elephant is hosting the Inclusion Festival & Special Needs Resource Fair at Mountain House Town Hall, from 10 AM to 2 PM. Alongside the fair, local businesses are offering special deals to our families all through November.",
            "El domingo 1 de noviembre, Aaria's Blue Elephant organiza el Festival de Inclusión y Feria de Recursos para Necesidades Especiales en el Ayuntamiento de Mountain House, de 10 AM a 2 PM. Además de la feria, negocios locales ofrecen promociones especiales a nuestras familias durante todo noviembre.")}
        </p>
        <p>
          {tr('Almost everything about the festival lives on a phone: the list of shops, the offers, the sign-in. But we learned quickly that the moments that matter most happen in the real world: a parent walking into a shop with a tired child, glancing at the counter, and deciding in about three seconds whether this is going to be easy. That moment belongs to a piece of paper.',
            'Casi todo lo del festival vive en un teléfono: la lista de negocios, las ofertas, el inicio de sesión. Pero aprendimos rápido que los momentos más importantes pasan en el mundo real: una mamá o un papá que entra a una tienda con un niño cansado, mira el mostrador y decide en unos tres segundos si esto va a ser fácil. Ese momento le pertenece a un papel.')}
        </p>
        <p>{tr("Here's what getting that paper right has taught us so far.", 'Esto es lo que nos ha enseñado hacer bien ese papel hasta ahora.')}</p>

        <H2>{tr('1. One sign, one job', '1. Un letrero, una tarea')}</H2>
        <p>
          {tr("Every shop that joins gets a QR sign to print and put by the register. Families scan it, tap Redeem, and show the shop a green screen with a live clock, so nobody can reuse an old screenshot. We kept the sign to one idea: scan here for your festival offer. No paragraphs, no fine print. When you're juggling a child, a bag and a wallet, one clear instruction beats five good ones.",
            'Cada negocio que se une recibe un letrero con código QR para imprimir y poner junto a la caja. Las familias lo escanean, tocan Canjear y le muestran al negocio una pantalla verde con un reloj en vivo, así nadie puede reusar una captura de pantalla vieja. Dejamos el letrero con una sola idea: escanea aquí para tu oferta del festival. Sin párrafos ni letra pequeña. Cuando estás cargando a un niño, una bolsa y la cartera, una instrucción clara vale más que cinco buenas.')}
        </p>

        <H2>{tr('2. A QR code is only as good as the link behind it', '2. Un código QR vale lo que vale el enlace detrás')}</H2>
        <p>
          {tr('The longer the web address, the denser the QR code, and dense codes struggle on a crooked angle under store lighting. So the address on each sign is as short as we could make it. We also made sure that older and misspelled versions of our festival links still land in the right place. Once something is printed, you can’t take it back, so the link has to keep working for as long as the paper exists.',
            'Mientras más larga la dirección web, más denso el código QR, y los códigos densos cuestan con un ángulo chueco y la luz de una tienda. Por eso la dirección de cada letrero es lo más corta posible. También nos aseguramos de que las versiones viejas o mal escritas de nuestros enlaces del festival sigan llevando al lugar correcto. Una vez impreso algo, no hay vuelta atrás, así que el enlace tiene que seguir funcionando mientras exista el papel.')}
        </p>

        <H2>{tr('3. A link you can say out loud', '3. Un enlace que se pueda decir en voz alta')}</H2>
        <p>
          {tr("Not everyone scans. Some phones are old, some cameras are cracked, and some people just prefer typing. So we also set up a festival link short enough for a volunteer to read out loud: aariasblueelephant.org/f. If you can't say your link in one breath, it's too long for print.",
            'No todos escanean. Algunos teléfonos son viejos, algunas cámaras están rotas y a algunas personas simplemente les gusta más escribir. Por eso también creamos un enlace del festival tan corto que un voluntario lo puede leer en voz alta: aariasblueelephant.org/f. Si no puedes decir tu enlace de un solo respiro, es demasiado largo para imprimirlo.')}
        </p>

        <H2>{tr('4. Design for the person reading it', '4. Diseña para la persona que lo lee')}</H2>
        <p>
          {tr("Many of our families include children and adults with sensory or reading differences. That changed how we think about print: big type, strong contrast, plain words, calm colors, and plenty of empty space. A busy, flashy sign can be a wall for someone who's already overwhelmed. A calm one says “you're welcome here” before anyone speaks.",
            'Muchas de nuestras familias incluyen niños y adultos con diferencias sensoriales o de lectura. Eso cambió cómo pensamos la impresión: letra grande, buen contraste, palabras sencillas, colores tranquilos y mucho espacio libre. Un letrero cargado y llamativo puede ser una barrera para alguien que ya está abrumado. Uno tranquilo dice “aquí eres bienvenido” antes de que nadie hable.')}
        </p>

        <H2>{tr('5. Make it recognizable from across the room', '5. Que se reconozca desde el otro lado del cuarto')}</H2>
        <p>
          {tr("Every festival sign shares the same gold frame. A family that redeemed an offer at the bakery should spot the same frame at the hair salon down the street without reading a word. Consistency is what turns many separate shops into one festival.",
            'Todos los letreros del festival tienen el mismo marco dorado. Una familia que canjeó una oferta en la panadería debería reconocer el mismo marco en la peluquería de la misma calle sin leer una sola palabra. La consistencia es lo que convierte muchos negocios separados en un solo festival.')}
        </p>

        <H2>{tr('6. Order early, and hold a real proof', '6. Pide con tiempo y revisa una prueba de verdad')}</H2>
        <p>
          {tr('Colors that look great on a laptop can print muddy, and a typo in a phone number is invisible until it is on 200 flyers. Leave enough time to hold a physical sample, and scan the QR code on that sample with two different phones before you approve the full run.',
            'Los colores que se ven increíbles en una laptop pueden salir opacos al imprimir, y un error en un número de teléfono es invisible hasta que está en 200 volantes. Deja tiempo suficiente para tener una muestra física en la mano y escanea el código QR de esa muestra con dos teléfonos distintos antes de aprobar el tiraje completo.')}
        </p>

        <H2>{tr('Where the paper comes from', 'De dónde sale el papel')}</H2>
        <p>
          {tr('Shops print their own QR sign straight from their festival page on any home or office printer, which keeps it free for them. For bigger pieces, like banners, table signs and sturdy cardstock flyers, an online printer is the easy route. ',
            'Los negocios imprimen su propio letrero QR directamente desde su página del festival en cualquier impresora de casa u oficina, así no les cuesta nada. Para piezas más grandes, como pancartas, letreros de mesa y volantes en cartulina gruesa, una imprenta en línea es el camino fácil. ')}
          <a href="https://www.4over4.com/" target="_blank" rel="sponsored noopener" className="font-semibold text-sky-600 dark:text-sky-400">4over4.com</a>
          {tr(' lets you order business cards, flyers, signs and banners in one place and have them delivered before event day. That matters when you are a small volunteer team also running a website, a festival and shop sign-ups at the same time.',
            ' te permite pedir tarjetas de presentación, volantes, letreros y pancartas en un solo lugar y recibirlos antes del día del evento. Eso importa cuando eres un pequeño equipo de voluntarios que también maneja un sitio web, un festival y las inscripciones de negocios al mismo tiempo.')}
        </p>

        <H2>{tr('The paper is the welcome', 'El papel es la bienvenida')}</H2>
        <p>
          {tr("The website gets families to the festival. The offers get them through the door. But what they actually see when they walk in is a printed sign on a counter, and for a family that's used to places that weren't built with them in mind, that small sign is the first thing telling them this place was. It's worth getting right.",
            'El sitio web trae a las familias al festival. Las ofertas las hacen entrar por la puerta. Pero lo que realmente ven al entrar es un letrero impreso en un mostrador, y para una familia acostumbrada a lugares que no se pensaron para ella, ese pequeño letrero es lo primero que le dice que este lugar sí. Vale la pena hacerlo bien.')}
        </p>
        <p>
          <Link to="/InclusionFestival" className="font-semibold text-sky-600 dark:text-sky-400">
            {tr('See the shops and offers for the Inclusion Festival →', 'Mira los negocios y ofertas del Festival de Inclusión →')}
          </Link>
        </p>

        <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {tr("Disclosure: this post was written as part of a 4over4 community promotion, and Aaria's Blue Elephant may receive store credit for it.",
            "Aviso: esta publicación se escribió como parte de una promoción comunitaria de 4over4, y Aaria's Blue Elephant puede recibir crédito en su tienda por ella.")}
        </p>
      </div>
    </article>
  </div>
);

export default FestivalPrintStory;
