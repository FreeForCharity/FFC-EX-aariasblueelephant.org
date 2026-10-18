import React, { useEffect, useRef, useState } from 'react';
import { QrSign } from './QrSign';

interface Props {
  name: string;
  offerEn: string;
  offerEs?: string | null;
  logoUrl?: string | null;
  redeemFrom: string;
  redeemTo: string;
  youngFounder?: boolean;
}

/** the printed sign, shrunk to fit: it is all em, so scaling the font scales everything */
const SignPreview: React.FC<Props> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(9);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { if (el.clientWidth) setSize(el.clientWidth / 31.4); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[18rem]" style={{ fontSize: size }}>
      <QrSign token="sample00preview00" sample {...props} />
    </div>
  );
};

export default SignPreview;
