import React, { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { redeemUrl, fmtDay } from '../../lib/festival/store';

/**
 * A QR code as crisp SVG — prints sharp at any size, no image to load.
 * Error correction 'Q' so a sign that gets a coffee ring still scans.
 */
export const QrCode: React.FC<{ text: string; className?: string; title?: string }> = ({ text, className, title }) => {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, 'Q');
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
  }, [text]);
  return (
    <svg viewBox={`0 0 ${n + 8} ${n + 8}`} className={className} role="img" aria-label={title || text}
         shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#000" />
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
}

/**
 * The sign a shop puts by the register. Always in both languages, whatever the
 * page is set to: whoever walks in is reading it, not the shop owner.
 *
 * It renders on screen as a preview, and printSign() prints only the sign —
 * one US Letter page.
 */
export const QrSign: React.FC<SignProps> = ({ token, name, offerEn, offerEs, logoUrl, redeemFrom, redeemTo }) => {
  const dates = `${fmtDay(redeemFrom, false)} – ${fmtDay(redeemTo, false)}`;
  const datesEs = `${fmtDay(redeemFrom, true)} – ${fmtDay(redeemTo, true)}`;
  return (
    <div className="qr-sign mx-auto flex aspect-[8.5/11] w-full max-w-md flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-[6%] text-center text-slate-900 shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/logo.webp" alt="" className="h-[2.2em] w-auto" />
        <div className="text-left leading-tight">
          <p className="text-[0.95em] font-black text-sky-700">Inclusion Festival</p>
          <p className="text-[0.7em] font-bold text-slate-500">Aaria's Blue Elephant · aariasblueelephant.org</p>
        </div>
      </div>

      <div>
        <p className="text-[1.6em] font-black leading-tight">Festival family?</p>
        <p className="text-[1.05em] font-bold text-slate-600">Scan to redeem your offer</p>
        <p className="mt-0.5 text-[0.85em] font-semibold italic text-slate-500">¿Familia del festival? Escanea para canjear tu oferta</p>
      </div>

      <QrCode text={redeemUrl(token)} className="w-[62%]" title={`Redeem at ${name}`} />

      <div className="w-full">
        <div className="flex items-center justify-center gap-2">
          {logoUrl && <img src={logoUrl} alt="" className="h-[2em] w-[2em] rounded object-contain" />}
          <p className="text-[1.3em] font-black leading-tight">{name}</p>
        </div>
        <p className="mt-1 text-[1em] font-bold text-sky-800">{offerEn}</p>
        {offerEs && offerEs !== offerEn && <p className="text-[0.85em] font-semibold italic text-slate-500">{offerEs}</p>}
        <p className="mt-2 text-[0.75em] font-bold text-slate-500">{dates} · {datesEs}</p>
        <p className="mt-1 text-[0.65em] text-slate-400">
          Use your phone's camera app · One per family · Usa la cámara de tu teléfono · Una por familia
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
    border: none !important; border-radius: 0 !important; box-shadow: none !important;
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
