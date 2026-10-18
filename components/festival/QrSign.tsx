import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { redeemUrl, fmtDay } from '../../lib/festival/store';

/**
 * A QR code as crisp SVG — prints sharp at any size, no image to load.
 * Error correction 'Q' so a sign that gets a coffee ring still scans.
 */
export const QrCode: React.FC<{ text: string; className?: string; title?: string; logo?: string }> = ({ text, className, title, logo }) => {
  const { d, n } = useMemo(() => {
    // with a logo over the middle, use the highest error correction (H, ~30%
    // recoverable) so the covered modules never stop it scanning
    const qr = qrcode(0, logo ? 'H' : 'Q');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
      }
    }
    return { d, n };
  }, [text, logo]);
  const size = n + 8;
  // the logo covers ~18% of the width — well inside what level H can lose
  const box = Math.round(size * 0.22);
  const at = (size - box) / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={title || text}
         shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#000" />
      {logo && (
        <>
          <rect x={at} y={at} width={box} height={box} rx={box * 0.22} fill="#fff" shapeRendering="geometricPrecision" />
          <image href={logo} x={at + box * 0.06} y={at + box * 0.06} width={box * 0.88} height={box * 0.88}
                 preserveAspectRatio="xMidYMid meet" />
        </>
      )}
    </svg>
  );
};

interface SignProps {
  token: string;
  name: string;
  offerEn: string;
  offerEs?: string | null;
  logoUrl?: string | null;
  redeemFrom: string;
  redeemTo: string;
  /** a kid's business — the sign says so, and says it proudly */
  youngFounder?: boolean;
}

/**
 * The sign a shop puts by the register — and, while it hangs there all month,
 * an advert for Aaria's Blue Elephant. Always in both languages, whatever the
 * page is set to: whoever walks in is reading it, not the shop owner.
 *
 *   blue band    our logo, "presents", the festival, "all November"
 *   middle       the QR (largest thing on the page) and the shop's offer
 *   light band   the line every customer reads: this shop welcomes every child
 *
 * It renders on screen as a preview, and printSign() prints only the sign —
 * one US Letter page.
 */
export const QrSign: React.FC<SignProps> = ({ token, name, offerEn, offerEs, logoUrl, redeemFrom, redeemTo, youngFounder }) => {
  const allNovember = redeemFrom.slice(5, 10) === '11-01' && redeemTo.slice(5, 10) === '11-30';
  // offers start when a shop is approved, so the end date is the one that matters
  const when = allNovember
    ? 'Offers all November · Ofertas todo noviembre'
    : `Offers through ${fmtDay(redeemTo, false)} · Ofertas hasta el ${fmtDay(redeemTo, true)}`;
  return (
    <div className="qr-sign mx-auto flex aspect-[8.5/11] w-full max-w-md flex-col overflow-hidden rounded-2xl border-[0.6em] border-[#E0A526] bg-white text-center text-slate-900 shadow-sm">
      {/* ── our band ── */}
      <div className="flex shrink-0 items-center gap-[0.8em] border-b-[0.35em] border-[#F5C542] bg-[#0C4A6E] px-[1.1em] py-[0.6em] text-left text-white">
        {/* the full round badge — it carries our name and "Building a New Inclusive World" */}
        <div className="shrink-0 rounded-full bg-[#F5C542] p-[0.22em] shadow-lg">
          <img src="/abe-logo.png" alt="Aaria's Blue Elephant" className="h-[5.8em] w-[5.8em] rounded-full bg-white object-contain" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[0.8em] font-black tracking-wide text-[#F5C542]">Aaria's Blue Elephant presents</p>
          <p className="text-[1.45em] font-black leading-none">Inclusion Festival</p>
          <p className="text-[0.82em] font-bold text-sky-100">&amp; Special Needs Resource Fair</p>
          <p className="mt-[0.25em] inline-block rounded-full bg-[#F5C542] px-[0.7em] py-[0.1em] text-[0.68em] font-black text-[#0C4A6E]">{when}</p>
        </div>
      </div>

      {/* ── the scan ── */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-evenly gap-[0.3em] px-[1.2em] py-[0.4em]">
        <div>
          {/* the headline carries it — a line of its own pushes the offer off the page */}
          <p className="text-[1.45em] font-black leading-tight">{youngFounder ? '🌟 A Young Founder’s festival offer' : '🎁 A special offer for festival families'}</p>
          <p className="text-[0.85em] font-semibold italic text-slate-500">{youngFounder ? 'La oferta de un joven emprendedor para el festival' : 'Una oferta especial para las familias del festival'}</p>
        </div>

        {/* a framed code with a tab on top — the thing your eye lands on across a busy counter */}
        <div className="relative w-[50%] pt-[0.9em]">
          <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F5C542] px-[0.9em] py-[0.15em] text-[0.8em] font-black uppercase tracking-[0.15em] text-[#0C4A6E] shadow">
            📱 Scan me · Escanéame
          </span>
          <div className="rounded-[1.1em] border-[0.45em] border-[#0C4A6E] bg-white p-[0.35em]">
            <QrCode text={redeemUrl(token)} className="block w-full" title={`Redeem at ${name}`} logo="/abe-logo.png" />
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-center gap-[0.4em]">
            {logoUrl && <img src={logoUrl} alt="" className="h-[1.9em] w-[1.9em] rounded object-contain" />}
            <p className="text-[1.25em] font-black leading-tight">{name}</p>
          </div>

          <div className="mx-auto mt-[0.35em] max-w-[92%] rounded-[0.6em] border-[0.12em] border-[#F5C542] bg-[#FFF7DB] px-[0.8em] py-[0.35em]">
            <p className="text-[1em] font-black text-[#92400E]">🎁 {offerEn}</p>
            {offerEs && offerEs !== offerEn && <p className="text-[0.8em] font-semibold italic text-[#B45309]">{offerEs}</p>}
          </div>
          <p className="mt-[0.3em] text-[0.62em] text-slate-400">Scan with your phone's camera · Escanea con la cámara de tu teléfono</p>
        </div>
      </div>

      {/* ── the advert ── */}
      <div className="shrink-0 bg-sky-50 px-[1.2em] py-[0.6em]">
        {youngFounder ? (
          <>
            <p className="text-[0.9em] font-black leading-snug text-[#0C4A6E]">💙 This young founder proudly supports inclusive communities.</p>
            <p className="text-[0.72em] font-semibold italic text-slate-500">Este joven emprendedor apoya con orgullo a las comunidades inclusivas.</p>
          </>
        ) : (
          <>
            <p className="text-[0.9em] font-black leading-snug text-[#0C4A6E]">💙 This business proudly welcomes children of all abilities.</p>
            <p className="text-[0.72em] font-semibold italic text-slate-500">Este negocio da la bienvenida a niños de todas las capacidades.</p>
          </>
        )}
        <p className="mt-[0.3em] text-[0.72em] font-bold text-slate-600">
          Free inclusive events for every family · <span className="text-[#0C4A6E]">aariasblueelephant.org</span>
        </p>
      </div>
    </div>
  );
};

const PRINT_CSS = `
@media print {
  @page { size: letter; margin: 0; }
  body.abe-print-sign * { visibility: hidden !important; }
  body.abe-print-sign .abe-print-target, body.abe-print-sign .abe-print-target * { visibility: visible !important; }
  body.abe-print-sign .abe-print-target {
    position: fixed !important; inset: 0 !important; margin: 0 !important;
    display: flex !important; align-items: center; justify-content: center;
    font-size: 26px !important; background: #fff;
  }
  body.abe-print-sign .abe-print-target .qr-sign {
    width: 8.5in !important; max-width: none !important; height: 11in !important;
    border-radius: 0 !important; box-shadow: none !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}`;

/** wrap a sign in this so printSign() knows what to print */
export const PrintTarget: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <>
    <style>{PRINT_CSS}</style>
    <div id={id} className="abe-print-scope">{children}</div>
  </>
);

/** print just the sign inside PrintTarget `id` */
export const printSign = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('abe-print-target');
  document.body.classList.add('abe-print-sign');
  const done = () => {
    el.classList.remove('abe-print-target');
    document.body.classList.remove('abe-print-sign');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
};
