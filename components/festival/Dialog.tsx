import React, { useEffect, useRef } from 'react';

interface Props {
  /** read out when the dialog opens */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  /** styling for the panel itself; the backdrop is fixed */
  className?: string;
  /** pinned to the bottom on phones, centred on larger screens */
  sheet?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A dialog that keyboard and screen-reader users can actually use.
 *
 * Without this, Tab walks straight out of an open dialog and into the page
 * behind it — which is still there, still covered, and still clickable. A
 * sighted mouse user never notices; anyone navigating by keyboard ends up
 * operating controls they cannot see, with nothing to tell them they left.
 *
 * So: focus moves in on open, Tab cycles inside, Escape closes, and focus
 * returns to whatever opened it. On an inclusion festival's own site this is
 * not a nicety.
 */
const Dialog: React.FC<Props> = ({ label, onClose, children, className = '', sheet }) => {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement;

    // prefer a text field — at a busy till, staff should be able to type the
    // code the moment the sheet opens without hunting for it
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) || []);
    const first = focusables();
    (first.find((el) => el.tagName === 'INPUT') || first[0] || panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) { e.preventDefault(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || !panel.current?.contains(active))) {
        e.preventDefault(); lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault(); firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);

    // the page behind must not scroll while a sheet is over it
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
      // only if it is still on the page — a re-render can detach it
      if (returnTo.current && document.contains(returnTo.current)) returnTo.current.focus();
    };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/50 ${
        sheet ? 'items-end sm:items-center sm:p-4' : 'items-center p-4'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`outline-none ${sheet ? 'w-full max-w-md rounded-t-3xl sm:rounded-3xl' : ''} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Dialog;
